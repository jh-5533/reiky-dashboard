-- ─────────────────────────────────────────────────────────────
-- REIKY SG  –  Dashboard Database Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles (extends auth.users) ────────────────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'staff' check (role in ('admin','staff')),
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can manage all profiles" on public.profiles using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Crystals ─────────────────────────────────────────────────
create table public.crystals (
  id              uuid default uuid_generate_v4() primary key,
  slug            text unique not null,
  name            text not null,
  stone_type      text,                     -- e.g. "Natural Citrine · A-Grade"
  category        text,                     -- 'wealth' | 'love' | 'protection'
  description     text,
  highlights      jsonb default '[]',       -- [{icon, title, desc}]
  properties      jsonb default '[]',       -- [{icon, label, value}]
  -- Pricing
  cost_price_mop  numeric(10,2),            -- cost from supplier in MOP
  markup_pct      numeric(5,2) default 50,  -- admin-approved markup %
  -- Status
  status          text default 'draft' check (status in ('draft','published','secret')),
  secret_token    text unique,              -- UUID token for secret links
  badge           text,                     -- 'Bestseller' | 'Popular' | 'New' | null
  -- Meta
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.crystals enable row level security;
create policy "Authenticated users can read crystals" on public.crystals for select to authenticated using (true);
create policy "Admins can manage crystals" on public.crystals for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Staff can update crystals" on public.crystals for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff'))
);

-- ── Crystal Variants (per bead size) ─────────────────────────
create table public.crystal_variants (
  id              uuid default uuid_generate_v4() primary key,
  crystal_id      uuid references public.crystals on delete cascade not null,
  bead_size_mm    numeric(4,1) not null,   -- e.g. 6.0, 8.0, 10.0, 12.0
  cost_price_mop  numeric(10,2) not null,  -- per-size cost from supplier
  sort_order      int default 0,
  in_stock        boolean default true,
  created_at      timestamptz default now()
);
alter table public.crystal_variants enable row level security;
create policy "Auth read variants" on public.crystal_variants for select to authenticated using (true);
create policy "Admin manage variants" on public.crystal_variants for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Crystal Images (up to 6) ─────────────────────────────────
create table public.crystal_images (
  id          uuid default uuid_generate_v4() primary key,
  crystal_id  uuid references public.crystals on delete cascade not null,
  storage_path text not null,              -- Supabase storage path
  url         text not null,              -- public URL
  sort_order  int default 0,              -- 0 = hero image
  created_at  timestamptz default now()
);
alter table public.crystal_images enable row level security;
create policy "Auth read images" on public.crystal_images for select to authenticated using (true);
create policy "Admin manage images" on public.crystal_images for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Services ─────────────────────────────────────────────────
create table public.services (
  id            uuid default uuid_generate_v4() primary key,
  slug          text unique not null,
  name          text not null,
  category      text,                      -- 'incense' | 'bazi' | 'fengshui' | 'custom'
  description   text,
  highlights    jsonb default '[]',
  tiers         jsonb default '[]',        -- [{name: 'Small', price_sgd: 88, desc: '...'}]
  price_sgd     numeric(10,2),             -- base price (if no tiers)
  status        text default 'draft' check (status in ('draft','published','secret')),
  secret_token  text unique,
  image_url     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.services enable row level security;
create policy "Auth read services" on public.services for select to authenticated using (true);
create policy "Admin manage services" on public.services for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Customers (CRM) ──────────────────────────────────────────
create table public.customers (
  id            uuid default uuid_generate_v4() primary key,
  email         text unique,
  full_name     text,
  phone         text,
  notes         text,                      -- internal notes
  tags          text[] default '{}',       -- e.g. ['vip','repeat']
  total_spent   numeric(10,2) default 0,
  order_count   int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.customers enable row level security;
create policy "Auth read customers" on public.customers for select to authenticated using (true);
create policy "Auth manage customers" on public.customers for all to authenticated using (true);

-- ── Orders ───────────────────────────────────────────────────
create table public.orders (
  id              uuid default uuid_generate_v4() primary key,
  order_number    text unique not null,    -- e.g. 'RKY-2026-0001'
  customer_id     uuid references public.customers,
  customer_email  text,
  status          text default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status  text default 'unpaid' check (payment_status in ('unpaid','paid','refunded','failed')),
  payment_method  text,                    -- 'airwallex' | 'bank_transfer' | 'cash' | null
  subtotal_sgd    numeric(10,2) default 0,
  discount_sgd    numeric(10,2) default 0, -- bundle discounts
  gst_sgd         numeric(10,2) default 0,
  total_sgd       numeric(10,2) default 0,
  notes           text,
  secret_link_id  uuid,                    -- if order came from a secret link
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Auth read orders" on public.orders for select to authenticated using (true);
create policy "Auth manage orders" on public.orders for all to authenticated using (true);

-- ── Order Items ───────────────────────────────────────────────
create table public.order_items (
  id              uuid default uuid_generate_v4() primary key,
  order_id        uuid references public.orders on delete cascade not null,
  product_type    text not null check (product_type in ('crystal','service')),
  crystal_id      uuid references public.crystals,
  variant_id      uuid references public.crystal_variants,
  service_id      uuid references public.services,
  name            text not null,
  bead_size_mm    numeric(4,1),
  unit_price_sgd  numeric(10,2) not null,
  quantity        int default 1,
  discount_pct    numeric(5,2) default 0,  -- 10 for bundle
  line_total_sgd  numeric(10,2) not null,
  created_at      timestamptz default now()
);
alter table public.order_items enable row level security;
create policy "Auth read order items" on public.order_items for select to authenticated using (true);
create policy "Auth manage order items" on public.order_items for all to authenticated using (true);

-- ── Secret Links ─────────────────────────────────────────────
create table public.secret_links (
  id            uuid default uuid_generate_v4() primary key,
  token         text unique not null default encode(gen_random_bytes(16), 'hex'),
  product_type  text not null check (product_type in ('crystal','service','bundle')),
  crystal_id    uuid references public.crystals,
  service_id    uuid references public.services,
  label         text,                      -- internal note e.g. "For John - custom citrine"
  custom_price  numeric(10,2),             -- override price for this link
  expires_at    timestamptz,               -- null = never expires
  max_uses      int,                       -- null = unlimited
  use_count     int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);
alter table public.secret_links enable row level security;
create policy "Admin manage secret links" on public.secret_links for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Staff read secret links" on public.secret_links for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff'))
);

-- ── Exchange Rate Cache ───────────────────────────────────────
create table public.exchange_rates (
  id          uuid default uuid_generate_v4() primary key,
  from_cur    text not null,   -- 'MOP'
  to_cur      text not null,   -- 'SGD'
  rate        numeric(12,6) not null,
  source      text,            -- 'api' | 'manual'
  fetched_at  timestamptz default now()
);

-- ── Settings ─────────────────────────────────────────────────
create table public.settings (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz default now()
);
insert into public.settings (key, value) values
  ('cc_fee_pct',        '"3.4"'),
  ('gst_pct',           '"9"'),
  ('default_markup_pct','"50"'),
  ('bundle_discount_pct','"10"'),
  ('currency_from',     '"MOP"'),
  ('currency_to',       '"SGD"');

alter table public.settings enable row level security;
create policy "Auth read settings" on public.settings for select to authenticated using (true);
create policy "Admin manage settings" on public.settings for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Auto-increment order numbers ─────────────────────────────
create sequence if not exists order_number_seq start 1;
create or replace function generate_order_number()
returns text language sql as $$
  select 'RKY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
$$;
create or replace function set_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := generate_order_number();
  end if;
  return new;
end;
$$;
create trigger before_insert_order
  before insert on public.orders
  for each row execute procedure set_order_number();

-- ── Updated_at triggers ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger crystals_updated_at before update on public.crystals for each row execute procedure update_updated_at();
create trigger services_updated_at before update on public.services for each row execute procedure update_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute procedure update_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute procedure update_updated_at();

-- ── Storage bucket ────────────────────────────────────────────
-- Run this AFTER creating the bucket named 'product-images' in Supabase Storage UI
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
