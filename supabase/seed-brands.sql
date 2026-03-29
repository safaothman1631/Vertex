-- ============================================================
-- Seed brands table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

insert into public.brands (name, logo, color1, color2, category_key) values
  ('Honeywell',      'honeywell.svg', '#ff4d00', '#c03200', 'scanners-mobility'),
  ('Zebra',          'zebra.svg',     '#1a1aaa', '#0d0d55', 'labels-mobility'),
  ('Ingenico',       'ingenico.svg',  '#e30613', '#8b0008', 'payment-terminals'),
  ('Verifone',       'verifone.svg',  '#007dc5', '#004d88', 'pos-terminals'),
  ('PAX Technology', 'pax.svg',       '#00a859', '#006633', 'smart-terminals'),
  ('Epson',          'epson.svg',     '#003087', '#001a55', 'printers-scanners'),
  ('Star Micronics', 'star.svg',      '#c0392b', '#7d1f17', 'receipt-printers'),
  ('Square',         'square.svg',    '#1a1a2e', '#0a0a15', 'pos-systems')
on conflict (name) do nothing;
