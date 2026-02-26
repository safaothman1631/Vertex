-- ============================================================
-- NexPOS Supabase Database Schema
-- Run this in the Supabase SQL Editor (project dashboard > SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  full_name  text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Products
create table if not exists public.products (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  brand        text not null,
  model        text not null default '',
  category     text not null default 'scanners',
  price        numeric(10,2) not null,
  old_price    numeric(10,2),
  description  text not null default '',
  specs        text[] default '{}',
  images       text[] default '{}',
  rating       numeric(3,1) not null default 4.5,
  review_count int not null default 0,
  in_stock     boolean not null default true,
  is_new       boolean not null default false,
  is_hot       boolean not null default false,
  created_at   timestamptz default now()
);

-- 3. Cart items (for server-side cart if needed; client uses localStorage via Zustand)
create table if not exists public.cart_items (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 4. Wishlist
create table if not exists public.wishlist (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 5. Orders
create table if not exists public.orders (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete set null,
  total               numeric(10,2) not null,
  status              text not null default 'pending'
                        check (status in ('pending','processing','shipped','delivered','cancelled')),
  stripe_session_id   text,
  shipping_address    jsonb not null default '{}',
  created_at          timestamptz default now()
);

-- 6. Order items
create table if not exists public.order_items (
  id         uuid default gen_random_uuid() primary key,
  order_id   uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity   int not null,
  price      numeric(10,2) not null,
  created_at timestamptz default now()
);

-- 7. Contact messages
create table if not exists public.contact_messages (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  subject    text not null default '',
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.products        enable row level security;
alter table public.cart_items      enable row level security;
alter table public.wishlist        enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.contact_messages enable row level security;

-- Profiles: users can read/update their own; admins can read all
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can read all profiles"
  on public.profiles for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Products: anyone can read; only admins can write
create policy "Anyone can read products"
  on public.products for select using (true);
create policy "Admins can insert products"
  on public.products for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can update products"
  on public.products for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can delete products"
  on public.products for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Cart items
create policy "Users manage own cart"
  on public.cart_items for all using (auth.uid() = user_id);

-- Wishlist
create policy "Users manage own wishlist"
  on public.wishlist for all using (auth.uid() = user_id);

-- Orders: users see own; admins see all
create policy "Users can read own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Service role can insert orders"
  on public.orders for insert with check (true);
create policy "Admins can read all orders"
  on public.orders for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can update orders"
  on public.orders for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Order items
create policy "Users can read own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));
create policy "Service role can insert order items"
  on public.order_items for insert with check (true);
create policy "Admins can read all order items"
  on public.order_items for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Contact messages: anyone can insert; only admins can read
create policy "Anyone can insert contact messages"
  on public.contact_messages for insert with check (true);
create policy "Admins can read contact messages"
  on public.contact_messages for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can update contact messages"
  on public.contact_messages for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
