-- Add sort_order column to products table for admin-controlled ordering
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Index for fast homepage ordering
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order ASC, created_at DESC);
