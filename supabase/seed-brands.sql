-- ============================================================
-- Seed brands table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.brands (
  id           uuid default gen_random_uuid() primary key,
  name         text not null unique,
  logo         text not null default '',
  color1       text not null default '#6366f1',
  color2       text not null default '#4338ca',
  category_key text not null default '',
  created_at   timestamptz default now()
);

alter table public.brands enable row level security;

do $outer$ begin
  if not exists (select 1 from pg_policies where tablename='brands' and policyname='Anyone can read brands') then
    execute 'create policy "Anyone can read brands" on public.brands for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='brands' and policyname='Admins can manage brands') then
    execute 'create policy "Admins can manage brands" on public.brands for all using ((select role from public.profiles where id = auth.uid()) = ''admin'')';
  end if;
end $outer$;

insert into public.brands (name, logo, color1, color2, category_key) values
  ('Honeywell',      'honeywell.svg', '#ff4d00', '#c03200', 'scanners-mobility'),
  ('Zebra',          'zebra.svg',     '#1a1aaa', '#0d0d55', 'labels-mobility'),
  ('Verifone',       'verifone.svg',  '#007dc5', '#004d88', 'pos-terminals'),
  ('PAX Technology', 'pax.svg',       '#00a859', '#006633', 'smart-terminals'),
  ('Epson',          'epson.svg',     '#003087', '#001a55', 'printers-scanners'),
  ('Star Micronics', 'star.svg',      '#c0392b', '#7d1f17', 'receipt-printers'),
  ('Square',         'square.svg',    '#1a1a2e', '#0a0a15', 'pos-systems')
on conflict (name) do nothing;
