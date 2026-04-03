-- Migration 003 — New preference columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme          text    NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS currency       text    NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS notify_wishlist boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_stock    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_sms      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS login_alerts    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_apply_coupon boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS compact_mode    boolean NOT NULL DEFAULT false;
