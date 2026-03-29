-- ============================================================
-- Settings page migration: new profile columns + user_addresses table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS preferred_locale text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_order boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_promo boolean NOT NULL DEFAULT false;

-- 2. Create user_addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label       text NOT NULL DEFAULT 'Home',
  name        text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  address     text NOT NULL DEFAULT '',
  city        text NOT NULL DEFAULT '',
  country     text NOT NULL DEFAULT '',
  zip         text NOT NULL DEFAULT '',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- 4. RLS policy: users manage own addresses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_addresses' AND policyname='Users manage own addresses') THEN
    CREATE POLICY "Users manage own addresses" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
