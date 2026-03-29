-- ============================================================
-- NexPOS – New Tables Migration
-- Tables: categories, reviews, coupons, notifications, inventory_log
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 9. Categories
-- ────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid default gen_random_uuid() primary key,
  name        text not null unique,          -- display name: "Scanners"
  slug        text not null unique,          -- filter key: "scanner"
  icon        text not null default '',      -- optional icon name
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);

alter table public.categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='Anyone can read categories') then
    execute 'create policy "Anyone can read categories" on public.categories for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='Admins can manage categories') then
    execute 'create policy "Admins can manage categories" on public.categories for all using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $$;

-- Seed categories from existing product data
insert into public.categories (name, slug, sort_order) values
  ('Scanners',    'scanner',     1),
  ('Payment',     'payment',     2),
  ('Terminals',   'terminal',    3),
  ('Printers',    'printer',     4),
  ('Mobile',      'mobile',      5),
  ('Accessories', 'accessories', 6),
  ('Kiosks',      'kiosk',       7),
  ('Software',    'software',    8),
  ('Bundles',     'bundle',      9)
on conflict (slug) do nothing;


-- ────────────────────────────────────────────────────────────
-- 10. Reviews
-- ────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  rating      int  not null check (rating >= 1 and rating <= 5),
  comment     text not null default '',
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='Anyone can read reviews') then
    execute 'create policy "Anyone can read reviews" on public.reviews for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='Users can insert own review') then
    execute 'create policy "Users can insert own review" on public.reviews for insert with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='Users can update own review') then
    execute 'create policy "Users can update own review" on public.reviews for update using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='Users can delete own review') then
    execute 'create policy "Users can delete own review" on public.reviews for delete using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='Admins can manage reviews') then
    execute 'create policy "Admins can manage reviews" on public.reviews for all using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 11. Coupons
-- ────────────────────────────────────────────────────────────
create table if not exists public.coupons (
  id              uuid default gen_random_uuid() primary key,
  code            text not null unique,
  discount_type   text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value  numeric(10,2) not null,
  min_order       numeric(10,2) not null default 0,
  max_uses        int,                              -- NULL = unlimited
  used_count      int  not null default 0,
  active          boolean not null default true,
  expires_at      timestamptz,                      -- NULL = never expires
  created_at      timestamptz default now()
);

alter table public.coupons enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='coupons' and policyname='Anyone can read active coupons') then
    execute 'create policy "Anyone can read active coupons" on public.coupons for select using (active = true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='coupons' and policyname='Admins can manage coupons') then
    execute 'create policy "Admins can manage coupons" on public.coupons for all using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 12. Notifications
-- ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  body        text not null default '',
  type        text not null default 'info' check (type in ('info', 'order', 'promo', 'system')),
  is_read     boolean not null default false,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can read own notifications') then
    execute 'create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can update own notifications') then
    execute 'create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Admins can manage notifications') then
    execute 'create policy "Admins can manage notifications" on public.notifications for all using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 13. Inventory Log
-- ────────────────────────────────────────────────────────────
create table if not exists public.inventory_log (
  id          uuid default gen_random_uuid() primary key,
  product_id  uuid references public.products(id) on delete cascade not null,
  change      int  not null,                       -- +10 = restock, -1 = sold
  reason      text not null default '',             -- 'sale', 'restock', 'adjustment', etc.
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

alter table public.inventory_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='inventory_log' and policyname='Admins can read inventory log') then
    execute 'create policy "Admins can read inventory log" on public.inventory_log for select using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
  if not exists (select 1 from pg_policies where tablename='inventory_log' and policyname='Admins can insert inventory log') then
    execute 'create policy "Admins can insert inventory log" on public.inventory_log for insert with check ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- Performance Indexes
-- ────────────────────────────────────────────────────────────
create index if not exists idx_reviews_product    on public.reviews(product_id);
create index if not exists idx_reviews_user       on public.reviews(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
create index if not exists idx_inventory_product  on public.inventory_log(product_id);
create index if not exists idx_coupons_code       on public.coupons(code);


-- ────────────────────────────────────────────────────────────
-- Enable Realtime for new tables that need it
-- ────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.reviews;
exception when duplicate_object then null;
end $$;
