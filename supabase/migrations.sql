-- ============================================================
-- Vertex MVP Feature Migrations
-- Run each section in the Supabase SQL Editor
-- ============================================================

-- ── 1. Stock Quantity on Products ──────────────────────────────
alter table public.products
  add column if not exists stock_quantity int not null default 9999;

-- ── 2. Shipping fields on Orders ───────────────────────────────
alter table public.orders
  add column if not exists shipping_method  text not null default 'standard',
  add column if not exists shipping_cost    numeric(10,2) not null default 0,
  add column if not exists tracking_number text,
  add column if not exists carrier          text;

-- ── 3. Images on Reviews ───────────────────────────────────────
alter table public.reviews
  add column if not exists images text[] default '{}';

-- ── 4. Return Requests ─────────────────────────────────────────
create table if not exists public.return_requests (
  id          uuid default gen_random_uuid() primary key,
  order_id    uuid references public.orders(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  reason      text not null,
  description text not null default '',
  images      text[] default '{}',
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected','refunded')),
  admin_note  text,
  refund_amount numeric(10,2),
  created_at  timestamptz default now()
);

alter table public.return_requests enable row level security;

create policy "Users can read own return requests"
  on public.return_requests for select using (auth.uid() = user_id);
create policy "Users can insert own return requests"
  on public.return_requests for insert with check (auth.uid() = user_id);
create policy "Admins can manage return requests"
  on public.return_requests for all using (public.is_admin());

-- ── 5. Product Q&A ─────────────────────────────────────────────
create table if not exists public.product_questions (
  id          uuid default gen_random_uuid() primary key,
  product_id  uuid references public.products(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  question    text not null,
  answer      text,
  answered_by uuid references public.profiles(id) on delete set null,
  answered_at timestamptz,
  is_public   boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.product_questions enable row level security;

create policy "Anyone can read public questions"
  on public.product_questions for select using (is_public = true);
create policy "Users can insert questions"
  on public.product_questions for insert with check (auth.uid() = user_id);
create policy "Admins can manage questions"
  on public.product_questions for all using (public.is_admin());

-- ── 6. Newsletter Subscribers ──────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id          uuid default gen_random_uuid() primary key,
  email       text not null unique,
  user_id     uuid references public.profiles(id) on delete set null,
  name        text,
  subscribed  boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe newsletter"
  on public.newsletter_subscribers for insert with check (true);
create policy "Admins can manage newsletter"
  on public.newsletter_subscribers for all using (public.is_admin());

-- ── 7. Product Variants ────────────────────────────────────────
create table if not exists public.product_variants (
  id             uuid default gen_random_uuid() primary key,
  product_id     uuid references public.products(id) on delete cascade not null,
  name           text not null,           -- e.g. "Color", "Size", "Storage"
  value          text not null,           -- e.g. "Red", "XL", "256GB"
  price_modifier numeric(10,2) not null default 0,  -- added to base price
  stock_quantity int not null default 99,
  sku            text,
  image_url      text,
  sort_order     int not null default 0,
  created_at     timestamptz default now()
);

alter table public.product_variants enable row level security;

create policy "Anyone can read variants"
  on public.product_variants for select using (true);
create policy "Admins can manage variants"
  on public.product_variants for all using (public.is_admin());

-- ── 8. Comparison Items (session-based — stored in localStorage, no table needed) ──

-- ── 9. Flash Sale helper: ensure promotions table has ends_at index ──
create index if not exists idx_promotions_ends_at on public.promotions(ends_at) where ends_at is not null;

-- ── 10. System Logs (for audit) ────────────────────────────────
create table if not exists public.system_logs (
  id         uuid default gen_random_uuid() primary key,
  level      text not null default 'info' check (level in ('info','warning','error','critical')),
  source     text not null default 'api'  check (source in ('api','auth','db','cron','manual','audit')),
  message    text not null,
  details    jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table public.system_logs enable row level security;

create policy "Admins can manage system logs"
  on public.system_logs for all using (public.is_admin());
