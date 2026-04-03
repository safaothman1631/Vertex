-- Back-in-stock subscription table
-- Users subscribe to get notified when an out-of-stock product returns
create table if not exists public.stock_subscribers (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  notified    boolean not null default false,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.stock_subscribers enable row level security;

create policy "Users manage own stock subscriptions"
  on public.stock_subscribers for all using (auth.uid() = user_id);
