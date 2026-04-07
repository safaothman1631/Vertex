## تەکنۆلۆجیاکانی ماستەر

```
PostgreSQL 15+     — DDL, DML, PL/pgSQL, CTEs, Window Functions, JSONB, Arrays
Supabase          — Auth, RLS, Realtime, Storage, Edge Functions, PostgREST
Data Modeling     — Normalization (3NF+), denormalization, star schema
Indexing          — B-tree, GIN, GiST, BRIN, partial, composite, covering
Performance       — EXPLAIN ANALYZE, query plans, seq scan vs index scan
Security          — RLS, SECURITY DEFINER, SET search_path, role-based access
Migrations        — Version-controlled, idempotent, rollback-safe
```

---

## بەشی ١: Schema Design — تەواوی ئامۆژگاریەکان

---

### §1. خشتەی ستاندارد — تەمپڵەیتی گشتی

```sql
-- ✅ هەموو خشتەیەک بەم شێوازە دروست بکە
CREATE TABLE IF NOT EXISTS public.example (
  -- Primary Key: هەمیشە UUID
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Key: هەمیشە بە REFERENCES + ON DELETE
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Text: هەمیشە TEXT + CHECK (نەک VARCHAR)
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  status      TEXT NOT NULL DEFAULT 'active' 
              CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- JSON: هەمیشە JSONB (نەک JSON)
  metadata    JSONB NOT NULL DEFAULT '{}',
  
  -- Numbers
  sort_order  INT NOT NULL DEFAULT 0,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  
  -- Arrays
  tags        TEXT[] NOT NULL DEFAULT '{}',
  images      TEXT[] NOT NULL DEFAULT '{}',
  
  -- Boolean
  is_active   BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps: هەمیشە TIMESTAMPTZ (نەک TIMESTAMP)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ✅ Comment لەسەر خشتە و ستوونەکان
COMMENT ON TABLE public.example IS 'Example table for demonstration';
COMMENT ON COLUMN public.example.metadata IS 'Additional JSON metadata';
```

### §2. Data Types — کەی چی بەکاربهێنیت

```sql
-- ══════════════════════════════════════════
-- DATA TYPE REFERENCE — PostgreSQL 15+
-- ══════════════════════════════════════════

-- ── Identity ──
UUID                    -- Primary keys, foreign keys
-- gen_random_uuid()    -- Auto-generate

-- ── Text ──
TEXT                    -- All strings (no VARCHAR!)
-- CHECK (char_length(x) BETWEEN min AND max) for length limits

-- ── Numbers ──
INT / INTEGER           -- Whole numbers (-2B to +2B)
BIGINT                  -- Large whole numbers
SMALLINT                -- Small numbers (-32K to +32K)
NUMERIC(10,2)           -- Exact decimals (money!)
REAL / FLOAT4           -- Approximate decimals (NEVER for money)
DOUBLE PRECISION        -- Approximate, more precision

-- ── Boolean ──
BOOLEAN                 -- true/false

-- ── Date/Time ──
TIMESTAMPTZ             -- Date + time + timezone (ALWAYS this!)
DATE                    -- Date only
TIME                    -- Time only
INTERVAL                -- Duration

-- ── JSON ──
JSONB                   -- Binary JSON (indexable, faster!)
-- JSON                 -- ❌ NEVER use — no index, slower

-- ── Arrays ──
TEXT[]                  -- Array of text
INT[]                   -- Array of integers
UUID[]                  -- Array of UUIDs

-- ── Special ──
INET                    -- IP addresses
CIDR                    -- Network ranges
TSVECTOR                -- Full-text search
POINT                   -- Geographic coordinates
```

### §3. Constraints — تەواو

```sql
-- ══════════════════════════════════════════
-- CONSTRAINT PATTERNS
-- ══════════════════════════════════════════

-- ── NOT NULL ──
column_name TEXT NOT NULL,                    -- Required field

-- ── DEFAULT ──
column_name TEXT NOT NULL DEFAULT '',         -- Default empty string
column_name INT NOT NULL DEFAULT 0,           -- Default zero
column_name BOOLEAN NOT NULL DEFAULT false,   -- Default false
column_name JSONB NOT NULL DEFAULT '{}',      -- Default empty object
column_name TEXT[] NOT NULL DEFAULT '{}',     -- Default empty array
column_name TIMESTAMPTZ NOT NULL DEFAULT now(), -- Default current time

-- ── CHECK — Single column ──
price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
rating INT CHECK (rating BETWEEN 1 AND 5),
email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
phone TEXT CHECK (phone ~ '^\+[0-9]{10,15}$'),
status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
slug TEXT CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

-- ── CHECK — Multi column ──
CONSTRAINT valid_price_range CHECK (old_price IS NULL OR old_price > price),
CONSTRAINT valid_date_range CHECK (start_date <= end_date),
CONSTRAINT valid_discount CHECK (
  (discount_type = 'percent' AND discount_value BETWEEN 1 AND 100) OR
  (discount_type = 'fixed' AND discount_value > 0)
),

-- ── UNIQUE ──
UNIQUE (email),                              -- Single column
UNIQUE (user_id, product_id),                -- Composite (one review per user per product)
UNIQUE (slug),                               -- URL slugs must be unique

-- ── FOREIGN KEY ──
user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- Self-referencing

-- ── EXCLUSION (advanced) ──
-- No overlapping date ranges for same user
EXCLUDE USING gist (
  user_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
),
```

### §4. ON DELETE — کەی کامیان

```sql
-- ══════════════════════════════════════════
-- ON DELETE BEHAVIORS
-- ══════════════════════════════════════════

-- CASCADE: بەکارهێنەر دەسڕدرێتەوە = هەموو داتاکەشی دەسڕدرێتەوە
-- بەکاربهێنە بۆ: cart_items, wishlist, reviews, user_addresses, notifications
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE

-- SET NULL: بەکارهێنەر دەسڕدرێتەوە = FK دەبێتە NULL (داتا دەمێنێت)
-- بەکاربهێنە بۆ: orders (ordered by deleted user), contact_messages
user_id UUID REFERENCES profiles(id) ON DELETE SET NULL

-- RESTRICT: ڕێگە مەدە بسڕدرێتەوە تا children هەن
-- بەکاربهێنە بۆ: products with order_items (can't delete ordered products)
product_id UUID REFERENCES products(id) ON DELETE RESTRICT

-- SET DEFAULT: بەکاربهێنە بۆ: reassign to "system" user
assigned_to UUID DEFAULT '00000000-0000-0000-0000-000000000000'
  REFERENCES profiles(id) ON DELETE SET DEFAULT
```

---

## بەشی ٢: خشتەکانی NexPOS — تەواوی Schema

---

### §5. profiles

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone           TEXT,
  avatar_url      TEXT,
  preferred_locale TEXT DEFAULT 'en' CHECK (preferred_locale IN ('en', 'ckb', 'ar', 'tr')),
  theme           TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  currency        TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'IQD', 'TRY')),
  newsletter      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update own profile
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Users can't change their own role!
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### §6. products

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL CHECK (price > 0),
  old_price     NUMERIC(10,2) CHECK (old_price IS NULL OR old_price > price),
  description   TEXT NOT NULL DEFAULT '',
  specs         TEXT[] NOT NULL DEFAULT '{}',
  images        TEXT[] NOT NULL DEFAULT '{}',
  rating        NUMERIC(2,1) NOT NULL DEFAULT 4.5 CHECK (rating BETWEEN 0 AND 5),
  review_count  INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  in_stock      BOOLEAN NOT NULL DEFAULT true,
  is_new        BOOLEAN NOT NULL DEFAULT false,
  is_hot        BOOLEAN NOT NULL DEFAULT false,
  hidden        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can read visible products, admin can do anything
CREATE POLICY "Public read visible products" ON public.products
  FOR SELECT USING (hidden = false OR public.is_admin());
CREATE POLICY "Admin insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update products" ON public.products
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete products" ON public.products
  FOR DELETE USING (public.is_admin());

-- Indexes
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_visible ON public.products(id) WHERE hidden = false;
CREATE INDEX idx_products_hot ON public.products(id) WHERE is_hot = true AND hidden = false;
CREATE INDEX idx_products_new ON public.products(id) WHERE is_new = true AND hidden = false;
CREATE INDEX idx_products_search ON public.products
  USING GIN(to_tsvector('english', name || ' ' || description || ' ' || brand));
```

### §7. orders & order_items

```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total             NUMERIC(10,2) NOT NULL CHECK (total > 0),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  stripe_session_id TEXT,
  shipping_address  JSONB NOT NULL DEFAULT '{}',
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity    INT NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  price       NUMERIC(10,2) NOT NULL CHECK (price > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users see own orders, admin sees all
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update orders" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- Order items follow order visibility
CREATE POLICY "Read order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR public.is_admin()))
  );
CREATE POLICY "Insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_stripe ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
```

### §8. cart_items & wishlist

```sql
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users manage only their own cart and wishlist
CREATE POLICY "Users own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cart_user ON public.cart_items(user_id);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
```

### §9. reviews

```sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL CHECK (char_length(comment) BETWEEN 5 AND 2000),
  helpful     INT NOT NULL DEFAULT 0 CHECK (helpful >= 0),
  verified    BOOLEAN NOT NULL DEFAULT false,
  hidden      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)  -- One review per user per product
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible reviews" ON public.reviews
  FOR SELECT USING (hidden = false OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin delete reviews" ON public.reviews
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(product_id, rating);

-- Auto-update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  target_product_id UUID;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  UPDATE public.products SET
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews 
       WHERE product_id = target_product_id AND hidden = false),
      4.5
    ),
    review_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = target_product_id AND hidden = false
    )
  WHERE id = target_product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();
```

### §10. brands, categories, coupons, notifications, user_addresses

```sql
-- ── Brands ──
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Categories ──
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Coupons ──
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 3 AND 50),
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order       NUMERIC(10,2) DEFAULT 0,
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active          BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'order', 'promo', 'system')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── User Addresses ──
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'work', 'other')),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'Iraq',
  zip         TEXT DEFAULT '',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Contact Messages ──
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Inventory Log ──
CREATE TABLE IF NOT EXISTS public.inventory_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  change      INT NOT NULL, -- positive = stock in, negative = stock out
  reason      TEXT NOT NULL CHECK (reason IN ('order', 'return', 'adjustment', 'restock')),
  note        TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS for all ──
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admin manage brands" ON public.brands FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Coupons: public can read active coupons (for validation), admin manages
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Notifications: user reads own
CREATE POLICY "Users own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Addresses: user manages own
CREATE POLICY "Users own addresses" ON public.user_addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contact: anyone can insert, admin reads
CREATE POLICY "Anyone can send message" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads messages" ON public.contact_messages
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin updates messages" ON public.contact_messages
  FOR UPDATE USING (public.is_admin());

-- Inventory log: admin only
CREATE POLICY "Admin manages inventory" ON public.inventory_log
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```

---

## بەشی ٣: RLS — تەواوی پاتێرنەکان

---

### §11. is_admin() Function — هەمیشە بەم شێوازە

```sql
-- ✅ SECURITY DEFINER: runs as function owner (bypasses caller's RLS)
-- ✅ SET search_path = '': prevents search_path injection attacks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

### §12. RLS Pattern Library — ٨ پاتێرن

```sql
-- ══════════════════════════════════════════
-- PATTERN A: Public Read, Admin Write
-- بەکاربهێنە بۆ: products, brands, categories
-- ══════════════════════════════════════════
CREATE POLICY "select_public" ON public.TABLE_NAME
  FOR SELECT USING (true);
CREATE POLICY "insert_admin" ON public.TABLE_NAME
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_admin" ON public.TABLE_NAME
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_admin" ON public.TABLE_NAME
  FOR DELETE USING (public.is_admin());

-- ══════════════════════════════════════════
-- PATTERN B: User Owns Data (full CRUD)
-- بەکاربهێنە بۆ: cart_items, wishlist, user_addresses
-- ══════════════════════════════════════════
CREATE POLICY "user_all" ON public.TABLE_NAME
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════
-- PATTERN C: User Reads Own, Admin Reads All
-- بەکاربهێنە بۆ: orders, notifications
-- ══════════════════════════════════════════
CREATE POLICY "select_own_or_admin" ON public.TABLE_NAME
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "insert_own" ON public.TABLE_NAME
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_admin" ON public.TABLE_NAME
  FOR UPDATE USING (public.is_admin());

-- ══════════════════════════════════════════
-- PATTERN D: Public Read (conditional), User Write
-- بەکاربهێنە بۆ: reviews (read visible, write own)
-- ══════════════════════════════════════════
CREATE POLICY "select_visible" ON public.TABLE_NAME
  FOR SELECT USING (hidden = false OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "insert_own" ON public.TABLE_NAME
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_or_admin" ON public.TABLE_NAME
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "delete_admin" ON public.TABLE_NAME
  FOR DELETE USING (public.is_admin());

-- ══════════════════════════════════════════
-- PATTERN E: Anyone Insert, Admin Read
-- بەکاربهێنە بۆ: contact_messages
-- ══════════════════════════════════════════
CREATE POLICY "anyone_insert" ON public.TABLE_NAME
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_select" ON public.TABLE_NAME
  FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update" ON public.TABLE_NAME
  FOR UPDATE USING (public.is_admin());

-- ══════════════════════════════════════════
-- PATTERN F: Admin Only
-- بەکاربهێنە بۆ: inventory_log, audit_log
-- ══════════════════════════════════════════
CREATE POLICY "admin_all" ON public.TABLE_NAME
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ══════════════════════════════════════════
-- PATTERN G: Service Role Only (no user access)
-- بەکاربهێنە بۆ: webhook data, internal tables
-- ══════════════════════════════════════════
-- No policies = only service_role can access

-- ══════════════════════════════════════════
-- PATTERN H: Nested/Related Data Access
-- بەکاربهێنە بۆ: order_items (visibility follows parent order)
-- ══════════════════════════════════════════
CREATE POLICY "follow_parent" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND (user_id = auth.uid() OR public.is_admin())
    )
  );
```

### §13. RLS Anti-Patterns — هەرگیز مەیکە

```sql
-- ❌ USING (true) بۆ INSERT/UPDATE/DELETE — هەرکەسێک دەتوانێت data بگۆڕێت!
CREATE POLICY "bad" ON public.orders FOR UPDATE USING (true); -- DANGEROUS!

-- ✅ هەمیشە restrict بکە
CREATE POLICY "good" ON public.orders FOR UPDATE USING (public.is_admin());

-- ❌ Recursive RLS — is_admin() خشتەی profiles دەخوێنێت، ئەگەر profiles RLS هەبێت = infinite loop
-- Fix: is_admin() MUST be SECURITY DEFINER (bypasses RLS)

-- ❌ Forgetting WITH CHECK on INSERT
CREATE POLICY "bad_insert" ON public.products FOR INSERT; -- No check = anyone can insert!

-- ✅ WITH CHECK دەبێت هەبێت
CREATE POLICY "good_insert" ON public.products 
  FOR INSERT WITH CHECK (public.is_admin());

-- ❌ Using FOR ALL without WITH CHECK
CREATE POLICY "bad_all" ON public.cart_items FOR ALL USING (auth.uid() = user_id);
-- This allows SELECT/UPDATE/DELETE but INSERT has no WITH CHECK!

-- ✅ FOR ALL needs BOTH USING and WITH CHECK
CREATE POLICY "good_all" ON public.cart_items 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## بەشی ٤: Indexing — تەواوی ستراتیجیەکان

---

### §14. Index Types

```sql
-- ══════════════════════════════════════════
-- B-TREE (Default) — equality, range, sorting
-- ══════════════════════════════════════════
CREATE INDEX idx_products_price ON public.products(price);
-- WHERE price = 100       → uses index
-- WHERE price > 50        → uses index
-- ORDER BY price          → uses index
-- WHERE price BETWEEN x AND y → uses index

-- ══════════════════════════════════════════
-- COMPOSITE — multi-column queries
-- ══════════════════════════════════════════
CREATE INDEX idx_reviews_product_rating ON public.reviews(product_id, rating);
-- ✅ WHERE product_id = x AND rating >= 4  → uses index
-- ✅ WHERE product_id = x                   → uses index (leftmost prefix)
-- ❌ WHERE rating >= 4                      → does NOT use index (no leftmost column)

-- ══════════════════════════════════════════
-- PARTIAL — only index rows matching condition
-- ══════════════════════════════════════════
CREATE INDEX idx_products_active ON public.products(id) WHERE hidden = false;
-- Smaller index, faster scans for active products only
-- Perfect for: soft-delete tables, status-filtered queries

CREATE INDEX idx_orders_pending ON public.orders(id, created_at) WHERE status = 'pending';
-- Only indexes pending orders — much smaller than full index

CREATE INDEX idx_coupons_valid ON public.coupons(code) 
  WHERE active = true AND (expires_at IS NULL OR expires_at > now());
-- ⚠️ Warning: `now()` in partial index is snapshot at creation time!
-- For dynamic conditions, use a function or query-time filter instead

-- ══════════════════════════════════════════
-- GIN — JSONB, arrays, full-text search
-- ══════════════════════════════════════════
CREATE INDEX idx_products_specs ON public.products USING GIN(specs);
-- WHERE specs @> '["barcode"]' → uses GIN

CREATE INDEX idx_orders_shipping ON public.orders USING GIN(shipping_address);
-- WHERE shipping_address @> '{"city": "Erbil"}' → uses GIN

CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
-- WHERE 'wireless' = ANY(tags) → uses GIN

-- ══════════════════════════════════════════
-- GIN — Full-text search
-- ══════════════════════════════════════════
CREATE INDEX idx_products_fts ON public.products 
  USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || brand));

-- Query:
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || brand)
  @@ plainto_tsquery('english', 'barcode scanner wireless')
ORDER BY ts_rank(
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || brand),
  plainto_tsquery('english', 'barcode scanner wireless')
) DESC;

-- ══════════════════════════════════════════
-- COVERING INDEX — includes extra columns
-- ══════════════════════════════════════════
CREATE INDEX idx_products_category_price ON public.products(category) INCLUDE (name, price, images);
-- Index-only scan: no heap access needed for these columns!

-- ══════════════════════════════════════════
-- BRIN — Block Range INdex (very large tables, natural ordering)
-- ══════════════════════════════════════════
CREATE INDEX idx_orders_created_brin ON public.orders USING BRIN(created_at);
-- Best for: time-series data, append-only tables
-- Much smaller than B-tree for large tables
```

### §15. When to Create Indexes

```
✅ CREATE INDEX WHEN:
  • Column appears in WHERE frequently
  • Column appears in JOIN ON clause
  • Column appears in ORDER BY
  • Foreign key columns (ALWAYS index FK columns!)
  • Columns with high cardinality (many unique values)
  
❌ DON'T CREATE INDEX WHEN:
  • Very small table (< 1000 rows)
  • Column has low cardinality (boolean, status with 3 values)
  • Table has heavy writes (every INSERT/UPDATE updates indexes)
  • Column is rarely queried
  • Already covered by existing composite index
```

---

## بەشی ٥: Query Optimization — تەواو

---

### §16. EXPLAIN ANALYZE — واتاکانی

```sql
-- ✅ هەمیشە بەم شێوازە تاقی بکەوە:
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT * FROM products WHERE category = 'POS' AND hidden = false;

-- ── واتاکانی ئەنجام ──
-- Seq Scan        → Full table scan (BAD for large tables) → Add index!
-- Index Scan      → Using index (GOOD)
-- Index Only Scan → Reading from index only (BEST) → Covering index
-- Bitmap Scan     → Index + heap (OK for medium selectivity)
-- Nested Loop     → O(n*m) — OK for small inner table
-- Hash Join       → O(n+m) — GOOD for large tables
-- Merge Join      → O(n+m) sorted — GOOD for pre-sorted data
-- Sort            → External sort (check work_mem)
-- HashAggregate   → GROUP BY using hash
-- actual time     → First row time..Last row time (ms)
-- rows            → Estimated vs actual rows
-- loops           → How many times this node executed

-- ── ئامانج ──
-- actual time < 10ms بۆ simple queries
-- actual time < 100ms بۆ complex queries
-- rows estimated ≈ actual (if very different → ANALYZE table)
-- No Seq Scan on large tables
```

### §17. Common Query Patterns — NexPOS

```sql
-- ══════════════════════════════════════════
-- PAGINATION — Offset vs Cursor
-- ══════════════════════════════════════════

-- ❌ Offset pagination (slow on page 100+)
SELECT * FROM products WHERE hidden = false
ORDER BY created_at DESC
LIMIT 12 OFFSET 1188;  -- page 100 × 12 = must skip 1188 rows!

-- ✅ Cursor/keyset pagination (constant speed)
SELECT * FROM products 
WHERE hidden = false AND created_at < $last_created_at
ORDER BY created_at DESC
LIMIT 12;

-- ✅ For Supabase (uses offset but acceptable for < 10K rows):
-- .range(from, to) translates to LIMIT/OFFSET

-- ══════════════════════════════════════════
-- DASHBOARD STATS — Single efficient query
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalProducts', (SELECT COUNT(*) FROM public.products WHERE hidden = false),
    'totalOrders', (SELECT COUNT(*) FROM public.orders),
    'totalRevenue', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status IN ('processing', 'shipped', 'delivered')),
    'totalUsers', (SELECT COUNT(*) FROM public.profiles),
    'pendingOrders', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
    'newOrdersToday', (SELECT COUNT(*) FROM public.orders WHERE created_at >= date_trunc('day', now())),
    'revenueToday', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status != 'cancelled' AND created_at >= date_trunc('day', now())),
    'lowStockProducts', (SELECT COUNT(*) FROM public.products WHERE stock < 5 AND hidden = false),
    'unreadMessages', (SELECT COUNT(*) FROM public.contact_messages WHERE status = 'new')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ══════════════════════════════════════════
-- REVENUE BY PERIOD — Date series
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_revenue_by_day(days INT DEFAULT 30)
RETURNS TABLE(day DATE, revenue NUMERIC, order_count BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT 
    d::date AS day,
    COALESCE(SUM(o.total), 0) AS revenue,
    COUNT(o.id) AS order_count
  FROM generate_series(
    date_trunc('day', now()) - (days || ' days')::interval,
    date_trunc('day', now()),
    '1 day'
  ) d
  LEFT JOIN public.orders o ON date_trunc('day', o.created_at) = d::date
    AND o.status NOT IN ('cancelled', 'pending')
  GROUP BY d
  ORDER BY d;
$$;

-- ══════════════════════════════════════════
-- TOP SELLING PRODUCTS — Window function
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_top_products(lim INT DEFAULT 10)
RETURNS TABLE(product_id UUID, product_name TEXT, total_sold BIGINT, total_revenue NUMERIC)
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT 
    p.id,
    p.name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.price) AS total_revenue
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled', 'pending')
  GROUP BY p.id, p.name
  ORDER BY total_sold DESC
  LIMIT lim;
$$;

-- ══════════════════════════════════════════
-- SEARCH — Multi-column with ranking
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.search_products(search_query TEXT, lim INT DEFAULT 20)
RETURNS SETOF public.products
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.*
  FROM public.products p
  WHERE p.hidden = false
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.brand ILIKE '%' || search_query || '%'
      OR p.model ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN p.name ILIKE search_query THEN 0          -- Exact name match
         WHEN p.name ILIKE search_query || '%' THEN 1   -- Name starts with
         WHEN p.name ILIKE '%' || search_query || '%' THEN 2  -- Name contains
         ELSE 3
    END,
    p.rating DESC,
    p.created_at DESC
  LIMIT lim;
$$;
```

### §18. N+1 Prevention — Supabase Joins

```sql
-- ══════════════════════════════════════════
-- N+1: هەموو join لە یەک query ـدا
-- ══════════════════════════════════════════

-- ❌ N+1 (JavaScript):
-- const orders = await supabase.from('orders').select('*')
-- for (const order of orders.data) {
--   const items = await supabase.from('order_items').select('*').eq('order_id', order.id)
--   // This makes N+1 queries!
-- }

-- ✅ Single query with nested select (Supabase):
-- const { data } = await supabase
--   .from('orders')
--   .select(`
--     id, total, status, created_at,
--     order_items (
--       id, quantity, price,
--       products ( id, name, slug, images )
--     )
--   `)
--   .eq('user_id', user.id)
--   .order('created_at', { ascending: false })

-- SQL equivalent:
SELECT 
  o.id, o.total, o.status, o.created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'price', oi.price,
        'product', json_build_object(
          'id', p.id, 'name', p.name, 'slug', p.slug, 'images', p.images
        )
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'
  ) AS items
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE o.user_id = auth.uid()
GROUP BY o.id
ORDER BY o.created_at DESC;
```

---

## بەشی ٦: Functions & Triggers — تەمپڵەیتی تەواو

---

### §19. Function Template

```sql
-- ══════════════════════════════════════════
-- FUNCTION TEMPLATE — هەمیشە بەم شێوازە
-- ══════════════════════════════════════════

-- ✅ Standard function pattern
CREATE OR REPLACE FUNCTION public.function_name(
  param1 UUID,
  param2 TEXT DEFAULT 'default_value',
  param3 INT DEFAULT 10
)
RETURNS return_type -- TABLE(...), SETOF type, JSON, VOID, BOOLEAN, etc.
LANGUAGE plpgsql    -- or sql for simple queries
SECURITY DEFINER    -- ⚠️ ALWAYS for functions that access data
SET search_path = '' -- ⚠️ ALWAYS to prevent injection
AS $$
DECLARE
  result return_type;
BEGIN
  -- Business logic here
  
  -- Error handling
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found: %', param1;
  END IF;
  
  RETURN result;
END;
$$;
```

### §20. Stock Management Functions

```sql
-- ✅ Decrement stock (atomic, race-condition safe)
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_quantity INT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.products
  SET 
    stock = stock - p_quantity,
    in_stock = (stock - p_quantity > 0),
    updated_at = now()
  WHERE id = p_product_id AND stock >= p_quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
  
  -- Log the change
  INSERT INTO public.inventory_log (product_id, change, reason)
  VALUES (p_product_id, -p_quantity, 'order');
END;
$$;

-- ✅ Increment stock (return/restock)
CREATE OR REPLACE FUNCTION public.increment_stock(
  p_product_id UUID,
  p_quantity INT,
  p_reason TEXT DEFAULT 'restock',
  p_note TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.products
  SET 
    stock = stock + p_quantity,
    in_stock = true,
    updated_at = now()
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;
  
  INSERT INTO public.inventory_log (product_id, change, reason, note, created_by)
  VALUES (p_product_id, p_quantity, p_reason, p_note, p_user_id);
END;
$$;

-- ✅ Process order: decrement stock for all items
CREATE OR REPLACE FUNCTION public.process_order_stock(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    PERFORM public.decrement_stock(item.product_id, item.quantity);
  END LOOP;
END;
$$;
```

### §21. Coupon Functions

```sql
-- ✅ Validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_order_total NUMERIC
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  coupon RECORD;
  discount NUMERIC;
BEGIN
  SELECT * INTO coupon FROM public.coupons
  WHERE code = UPPER(TRIM(p_code))
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses);
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;
  
  IF p_order_total < coupon.min_order THEN
    RETURN json_build_object(
      'valid', false, 
      'error', format('Minimum order amount is $%s', coupon.min_order)
    );
  END IF;
  
  -- Calculate discount
  IF coupon.discount_type = 'percent' THEN
    discount := ROUND(p_order_total * coupon.discount_value / 100, 2);
  ELSE
    discount := LEAST(coupon.discount_value, p_order_total);
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'coupon_id', coupon.id,
    'discount', discount,
    'discount_type', coupon.discount_type,
    'discount_value', coupon.discount_value
  );
END;
$$;

-- ✅ Use coupon (increment used_count)
CREATE OR REPLACE FUNCTION public.use_coupon(p_code TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = UPPER(TRIM(p_code))
    AND active = true
    AND (max_uses IS NULL OR used_count < max_uses);
END;
$$;
```

### §22. Notification Functions

```sql
-- ✅ Create notification for user
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notif_id;
  
  RETURN notif_id;
END;
$$;

-- ✅ Notify all admins
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  admin_id UUID;
BEGIN
  FOR admin_id IN
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    PERFORM public.notify_user(admin_id, p_type, p_title, p_message, p_data);
  END LOOP;
END;
$$;

-- ✅ Auto-notify on new order
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Notify admin
  PERFORM public.notify_admins(
    'order',
    'داواکارییەکی نوێ',
    format('داواکاری #%s بە بڕی $%s', LEFT(NEW.id::text, 8), NEW.total),
    json_build_object('order_id', NEW.id)::jsonb
  );
  
  -- Notify user
  PERFORM public.notify_user(
    NEW.user_id,
    'order',
    'داواکاریەکەت وەرگیرا',
    format('داواکاری #%s بە سەرکەوتوویی تۆمارکرا', LEFT(NEW.id::text, 8)),
    json_build_object('order_id', NEW.id)::jsonb
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_order();
```

### §23. updated_at Trigger — بۆ هەموو خشتەکان

```sql
-- ✅ Generic updated_at function (one function for all tables)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column:
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## بەشی ٧: Migrations — تەواوی پراکتیسەکان

---

### §24. Migration File Structure

```sql
-- ══════════════════════════════════════════
-- MIGRATION FILE: supabase/migrations/YYYYMMDD_description.sql
-- ══════════════════════════════════════════

-- ✅ Rule 1: ALWAYS idempotent
CREATE TABLE IF NOT EXISTS ...;
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;
DROP INDEX IF EXISTS ...;
CREATE INDEX IF NOT EXISTS ...;
CREATE OR REPLACE FUNCTION ...;

-- ✅ Rule 2: ALWAYS in transaction
BEGIN;

  -- Step 1: Schema changes
  ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS weight NUMERIC(6,2);
  
  -- Step 2: Data backfill
  UPDATE public.products 
  SET sku = 'SKU-' || LEFT(id::text, 8) 
  WHERE sku IS NULL;
  
  -- Step 3: Constraints (after data is valid)
  ALTER TABLE public.products 
    ALTER COLUMN sku SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku 
    ON public.products(sku);
  
  -- Step 4: New policies/functions
  -- ...

COMMIT;

-- ✅ Rule 3: Include rollback comment
-- ROLLBACK:
-- ALTER TABLE public.products DROP COLUMN IF EXISTS sku;
-- ALTER TABLE public.products DROP COLUMN IF EXISTS weight;
```

### §25. Common Migration Patterns

```sql
-- ── Add column ──
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight NUMERIC(6,2) DEFAULT 0;

-- ── Rename column ──
ALTER TABLE public.products RENAME COLUMN old_name TO new_name;

-- ── Change column type ──
ALTER TABLE public.products ALTER COLUMN price TYPE NUMERIC(12,2);

-- ── Add NOT NULL (with default for existing rows) ──
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';
UPDATE public.products SET sku = 'SKU-' || LEFT(id::text, 8) WHERE sku = '';
ALTER TABLE public.products ALTER COLUMN sku SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN sku DROP DEFAULT;

-- ── Add CHECK constraint ──
ALTER TABLE public.products ADD CONSTRAINT chk_products_price CHECK (price > 0);

-- ── Drop column (careful!) ──
ALTER TABLE public.products DROP COLUMN IF EXISTS deprecated_column;

-- ── Add enum value ──
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));
```

---

## بەشی ٨: Supabase-Specific — Realtime, Storage, Edge Functions

---

### §26. Supabase Realtime

```sql
-- ✅ Enable Realtime on specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- JavaScript subscription:
-- const channel = supabase
--   .channel('orders')
--   .on('postgres_changes', {
--     event: 'INSERT',
--     schema: 'public',
--     table: 'orders',
--     filter: `user_id=eq.${userId}`
--   }, (payload) => { ... })
--   .subscribe()
```

### §27. Supabase Storage Policies

```sql
-- ✅ Product images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- Storage RLS policies
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Admin upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND public.is_admin()
  );

CREATE POLICY "Admin delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND public.is_admin()
  );
```

---

## بەشی ٩: CTE و Window Functions — پاتێرنەکانی پێشکەوتوو

---

### §28. Common Table Expressions (CTEs)

```sql
-- ✅ CTE بۆ readable complex queries
WITH 
  monthly_revenue AS (
    SELECT 
      date_trunc('month', created_at) AS month,
      SUM(total) AS revenue,
      COUNT(*) AS orders
    FROM public.orders
    WHERE status NOT IN ('cancelled', 'pending')
    GROUP BY date_trunc('month', created_at)
  ),
  prev_month AS (
    SELECT 
      month,
      revenue,
      orders,
      LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
      LAG(orders) OVER (ORDER BY month) AS prev_orders
    FROM monthly_revenue
  )
SELECT 
  month,
  revenue,
  orders,
  ROUND(((revenue - prev_revenue) / NULLIF(prev_revenue, 0)) * 100, 1) AS revenue_growth_pct,
  orders - prev_orders AS orders_growth
FROM prev_month
ORDER BY month DESC
LIMIT 12;
```

### §29. Window Functions

```sql
-- ✅ Ranking products by revenue within each category
SELECT 
  name,
  category,
  price,
  RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) AS newest_rank,
  SUM(price) OVER (PARTITION BY category) AS category_total,
  COUNT(*) OVER (PARTITION BY category) AS category_count,
  AVG(price) OVER (PARTITION BY category) AS category_avg_price
FROM public.products
WHERE hidden = false;

-- ✅ Running total of daily orders
SELECT 
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS daily_orders,
  SUM(total) AS daily_revenue,
  SUM(COUNT(*)) OVER (ORDER BY date_trunc('day', created_at)) AS cumulative_orders,
  SUM(SUM(total)) OVER (ORDER BY date_trunc('day', created_at)) AS cumulative_revenue
FROM public.orders
WHERE status != 'cancelled'
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;
```

---

## بەشی ١٠: JSONB — تەواوی ئۆپەرەیشنەکان

---

### §30. JSONB Operations

```sql
-- ══════════════════════════════════════════
-- JSONB OPERATORS
-- ══════════════════════════════════════════

-- Access
data->>'key'           -- As TEXT  (returns NULL if missing)
data->'nested'->'key'  -- As JSONB (for nested access)
data#>>'{a,b,c}'       -- Deep path as TEXT: data.a.b.c

-- Query
data @> '{"key": "value"}'    -- Contains (GIN indexable!)
data ? 'key'                   -- Has key?
data ?| ARRAY['a','b']         -- Has any key?
data ?& ARRAY['a','b']         -- Has all keys?

-- Modify
data || '{"new_key": "value"}'              -- Merge/add key
data - 'key'                                 -- Remove key  
data #- '{nested,key}'                       -- Remove nested key
jsonb_set(data, '{key}', '"new_value"')      -- Set specific key
jsonb_set(data, '{nested,key}', '"value"')   -- Set nested key

-- Array operations inside JSONB
data->'items'->0              -- First array element
jsonb_array_length(data->'items')  -- Array length

-- ✅ Example: shipping address queries
SELECT * FROM public.orders
WHERE shipping_address->>'city' = 'Erbil';

SELECT * FROM public.orders
WHERE shipping_address @> '{"country": "Iraq"}';

-- ✅ Example: Update specific field in JSONB
UPDATE public.orders
SET shipping_address = jsonb_set(shipping_address, '{status}', '"confirmed"')
WHERE id = $1;
```

---

## بەشی ١١: Backup & Maintenance

---

### §31. Database Maintenance

```sql
-- ✅ Analyze tables (update planner statistics)
ANALYZE public.products;
ANALYZE public.orders;

-- ✅ Vacuum (reclaim space from deleted rows)
VACUUM ANALYZE public.products;

-- ✅ Check table size
SELECT 
  schemaname,
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- ✅ Check index usage
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan;
-- Indexes with idx_scan = 0 are unused → consider dropping

-- ✅ Find slow queries (in Supabase dashboard → SQL Editor)
SELECT
  calls,
  ROUND(total_exec_time::numeric / 1000, 2) AS total_secs,
  ROUND(mean_exec_time::numeric, 2) AS avg_ms,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ✅ Check for missing indexes
SELECT
  relname AS table_name,
  seq_scan AS sequential_scans,
  seq_tup_read AS rows_scanned,
  idx_scan AS index_scans,
  CASE WHEN seq_scan > 0
    THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 1)
    ELSE 100
  END AS index_usage_pct
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_scan DESC;
-- Tables with low index_usage_pct need indexes!
```

### §32. Backup Function

```sql
-- ✅ Export critical data as JSON (via RPC)
CREATE OR REPLACE FUNCTION public.export_data()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN json_build_object(
    'exported_at', now(),
    'products', (SELECT json_agg(row_to_json(p)) FROM public.products p),
    'brands', (SELECT json_agg(row_to_json(b)) FROM public.brands b),
    'categories', (SELECT json_agg(row_to_json(c)) FROM public.categories c),
    'coupons', (SELECT json_agg(row_to_json(cp)) FROM public.coupons cp),
    'orders', (SELECT json_agg(row_to_json(o)) FROM public.orders o),
    'order_items', (SELECT json_agg(row_to_json(oi)) FROM public.order_items oi),
    'reviews', (SELECT json_agg(row_to_json(r)) FROM public.reviews r),
    'profiles', (SELECT json_agg(json_build_object(
      'id', pr.id, 'email', pr.email, 'full_name', pr.full_name, 
      'role', pr.role, 'created_at', pr.created_at
    )) FROM public.profiles pr)
  );
END;
$$;
```

---

## چەکلیستی تەواو — ٢٥ خاڵ

```
□ IF NOT EXISTS بۆ هەموو DDL (CREATE TABLE, CREATE INDEX, etc.)
□ RLS ENABLED لەسەر هەموو خشتەکان
□ RLS policies بۆ هەموو operations (SELECT, INSERT, UPDATE, DELETE)
□ Foreign keys بە ON DELETE CASCADE/SET NULL/RESTRICT
□ CHECK constraints بۆ enums (status, role, type)
□ CHECK constraints بۆ ranges (price > 0, rating 1-5)
□ DEFAULT values بۆ هەموو columns ی پێویست
□ NOT NULL بۆ هەموو شتێکی گرنگ
□ UUID primary keys (gen_random_uuid())
□ TIMESTAMPTZ بۆ dates (نەک TIMESTAMP)
□ TEXT بۆ وتار (نەک VARCHAR) + CHECK بۆ length
□ NUMERIC(10,2) بۆ نرخ (نەک FLOAT)
□ JSONB بۆ JSON data (نەک JSON)
□ Index لەسەر foreign keys
□ Index لەسەر frequently-queried columns
□ Partial indexes بۆ common filters (hidden=false, status='pending')
□ GIN indexes بۆ JSONB و arrays
□ Composite indexes بۆ multi-column queries (leftmost prefix rule!)
□ EXPLAIN ANALYZE بۆ heavy queries
□ SECURITY DEFINER + SET search_path = '' بۆ functions
□ updated_at trigger لەسەر هەموو خشتەکان
□ Migration files idempotent (IF NOT EXISTS, IF EXISTS)
□ Migrations inside transactions (BEGIN/COMMIT)
□ Rollback instructions in migration comments
□ ANALYZE after bulk data changes
```

---

