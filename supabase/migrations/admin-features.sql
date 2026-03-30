-- ============================================================
-- Promotions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  description text DEFAULT '',
  image_url  text DEFAULT '',
  link_url   text DEFAULT '',
  badge_text text DEFAULT '',
  position   text NOT NULL DEFAULT 'bar' CHECK (position IN ('hero_banner','bar','popup','sidebar')),
  is_active  boolean DEFAULT true,
  starts_at  timestamptz DEFAULT now(),
  ends_at    timestamptz,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_promotions_all" ON public.promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public can read active promotions within date range
CREATE POLICY "public_read_active_promotions" ON public.promotions
  FOR SELECT USING (
    is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- ============================================================
-- System logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level      text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warning','error','critical')),
  source     text NOT NULL DEFAULT 'api' CHECK (source IN ('api','auth','db','cron','manual')),
  message    text NOT NULL,
  details    jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "admin_read_logs" ON public.system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert (no RLS bypass needed for service role, but explicit policy for safety)
CREATE POLICY "service_insert_logs" ON public.system_logs
  FOR INSERT WITH CHECK (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions (is_active, starts_at, ends_at);
