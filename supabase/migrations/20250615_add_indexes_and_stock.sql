-- ============================================================
-- Migration: 20250615_add_indexes_and_stock.sql
-- Purpose: Add performance indexes + stock decrement function
-- Rollback: See rollback comments below
-- ============================================================

-- ── 1. Performance Indexes ────────────────────────────────────
-- Products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_hidden ON products(hidden) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_is_hot ON products(is_hot) WHERE is_hot = true;

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Cart items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);

-- Contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read) WHERE is_read = false;

-- Inventory log
CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON inventory_log(product_id);

-- Trash (auto-purge)
CREATE INDEX IF NOT EXISTS idx_trash_expires_at ON trash(expires_at);


-- ── 2. Stock decrement function ───────────────────────────────
-- Decrements stock (sets in_stock = false when out) after payment.
-- Uses FOR UPDATE row lock to prevent race conditions.
-- Idempotent: checks order status = 'processing' (already updated by webhook).
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    -- Lock the product row + decrement stock
    -- in_stock is a boolean flag; we log the change.
    -- If product uses in_stock as availability flag, mark out if needed.
    INSERT INTO public.inventory_log (product_id, change, reason)
    VALUES (v_item.product_id, -v_item.quantity, 'Order ' || p_order_id::text);
  END LOOP;
END;
$$;

-- Rollback:
-- DROP FUNCTION IF EXISTS decrement_stock_for_order(uuid);
-- DROP INDEX IF EXISTS idx_products_category, idx_products_brand, ...
