-- Nhyira Spa: schema + seed.
-- Run this whole file in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to run more than once.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Treatments
-- ---------------------------------------------------------------------------
create table if not exists public.treatments (
  id            text primary key,
  name          text    not null,
  category      text    not null check (category in ('Massage', 'Facials', 'Hands & feet', 'Rituals')),
  duration_min  int     not null check (duration_min > 0),
  price_ghs     int     not null check (price_ghs > 0),
  description   text    not null,
  image_url     text    not null,
  sort          int     not null default 0
);

insert into public.treatments (id, name, category, duration_min, price_ghs, description, image_url, sort) values
  ('swedish',               'Swedish',               'Massage',      60,  450,  'Long, slow strokes. Full switch-off.',     '/images/swedish-960.webp',               1),
  ('deep-tissue',           'Deep tissue',           'Massage',      60,  550,  'Firm pressure for back, neck, shoulders.', '/images/deep-tissue-960.webp',           2),
  ('hot-stone',             'Hot stone',             'Massage',      90,  750,  'Warm basalt stones, deep release.',        '/images/hot-stone-960.webp',             3),
  ('glow-facial',           'Glow facial',           'Facials',      60,  500,  'Cleanse, exfoliate, mask, massage.',       '/images/glow-facial-960.webp',           4),
  ('hydrate-facial',        'Hydrate',               'Facials',      45,  380,  'For skin tired from sun and harmattan.',   '/images/hydrate-facial-960.webp',        5),
  ('spa-pedicure',          'Spa pedicure',          'Hands & feet', 60,  250,  'Soak, scrub, massage, polish.',            '/images/spa-pedicure-960.webp',          6),
  ('manicure',              'Manicure',              'Hands & feet', 40,  150,  'Shape, cuticle care, polish.',             '/images/manicure-960.webp',              7),
  ('half-day-ritual',       'Half-day ritual',       'Rituals',      240, 1350, 'Hot stone massage, facial, spa pedicure.', '/images/half-day-ritual-960.webp',       8),
  ('side-by-side',          'Side by side',          'Rituals',      60,  900,  'Two massages in one room.',                '/images/side-by-side-960.webp',          9),
  ('glow-before-the-party', 'Glow before the party', 'Rituals',      150, 850,  'Facial, manicure, pedicure.',              '/images/glow-before-the-party-960.webp', 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  duration_min = excluded.duration_min,
  price_ghs = excluded.price_ghs,
  description = excluded.description,
  image_url = excluded.image_url,
  sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  treatment_id        text        not null references public.treatments (id),
  start_at            timestamptz not null, -- Accra is GMT (UTC+0) all year
  customer_name       text        not null,
  whatsapp            text        not null,
  email               text        not null,
  total_ghs           int         not null check (total_ghs > 0),
  deposit_ghs         int         not null check (deposit_ghs > 0),
  paystack_reference  text        not null unique,
  status              text        not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

-- No double-booking: only one PAID booking per start time.
create unique index if not exists bookings_one_paid_per_slot
  on public.bookings (start_at)
  where status = 'paid';

-- Also only one live hold per start time (a pending booking holds the slot for
-- 15 minutes while the customer pays). The server cancels stale holds first.
create unique index if not exists bookings_one_active_per_slot
  on public.bookings (start_at)
  where status in ('pending', 'paid');

create index if not exists bookings_start_at_idx on public.bookings (start_at);
create index if not exists bookings_pending_created_idx on public.bookings (created_at) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- RLS on, no policies: the anon/authenticated keys can read or write nothing.
-- Only the Express server touches these tables, using the secret
-- (service role) key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.treatments enable row level security;
alter table public.bookings   enable row level security;

-- ---------------------------------------------------------------------------
-- Expire pending holds older than 15 minutes. Called by the server; also handy
-- to run by hand: select public.expire_stale_bookings();
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_bookings()
returns int
language sql
security definer
set search_path = public
as $$
  with expired as (
    update public.bookings
       set status = 'cancelled'
     where status = 'pending'
       and created_at < now() - interval '15 minutes'
    returning 1
  )
  select count(*)::int from expired;
$$;

revoke all on function public.expire_stale_bookings() from public, anon, authenticated;
grant execute on function public.expire_stale_bookings() to service_role;
