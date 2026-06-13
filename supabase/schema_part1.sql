-- PART 1: Create tables (run this first)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  images text[] not null default '{}',
  category text not null,
  subcategory text,
  brand text not null,
  stock integer not null default 0,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  tags text[] not null default '{}',
  specifications jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  status text not null default 'pending'
    check (status in ('pending','processing','shipped','delivered','cancelled')),
  subtotal numeric(10,2) not null,
  tax numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  shipping_address jsonb not null,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade not null,
  product_id uuid references public.products on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null,
  image text not null,
  created_at timestamptz not null default now()
);
