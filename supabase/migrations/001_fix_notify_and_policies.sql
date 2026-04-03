-- ============================================================
-- Migration 001 — Safe to run even if already partially applied
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add missing notification-preference columns to profiles
--    (IF NOT EXISTS means it won't fail if they already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_order boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_promo boolean NOT NULL DEFAULT false;

-- 2. Notification policies (DROP first so no "already exists" error)
DROP POLICY IF EXISTS "Users can read own notifications"    ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications"     ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow the service role (used by API routes / webhooks) to INSERT notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

-- 3. Profile policies (DROP first to avoid duplicate error)
DROP POLICY IF EXISTS "Users can read own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
