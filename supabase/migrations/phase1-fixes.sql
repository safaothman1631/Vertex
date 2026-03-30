-- ============================================================
-- Phase 1: Critical DB fixes
-- Run via: npx supabase db query --linked -f supabase/migrations/phase1-fixes.sql
-- ============================================================

-- 1. Fix order insert RLS: only authenticated user can insert their own orders
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix order_items insert RLS: only let users insert items for their own orders
DROP POLICY IF EXISTS "Service role can insert order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

-- 3. Create increment_coupon_used function (called by checkout)
CREATE OR REPLACE FUNCTION public.increment_coupon_used(coupon_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$;

-- 4. Create update_product_review_stats trigger function
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products SET
      review_count = (SELECT count(*) FROM reviews WHERE product_id = OLD.product_id),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews WHERE product_id = OLD.product_id), 0)
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE products SET
      review_count = (SELECT count(*) FROM reviews WHERE product_id = NEW.product_id),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews WHERE product_id = NEW.product_id), 0)
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Attach trigger to reviews table
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();

-- 5. Add updated_at columns to key tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products', 'orders', 'profiles', 'brands', 'categories']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl
    );
  END LOOP;
END $$;

-- 6. Create missing user_addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  label       text not null default 'Home',
  name        text not null default '',
  phone       text not null default '',
  address     text not null default '',
  city        text not null default '',
  country     text not null default '',
  zip         text not null default '',
  is_default  boolean not null default false,
  created_at  timestamptz default now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Users manage own addresses
DO $$ BEGIN
  CREATE POLICY "Users manage own addresses"
    ON public.user_addresses FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products (in_stock);
CREATE INDEX IF NOT EXISTS idx_products_hidden ON public.products (hidden);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages (is_read);
CREATE INDEX IF NOT EXISTS idx_trash_expires_at ON public.trash (expires_at);
CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON public.inventory_log (product_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses (user_id) ;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
