-- PART 2: Enable RLS and add policies (drops existing ones first)

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Products are publicly visible" on public.products;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Only admins can manage products" on public.products;
drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users view own orders" on public.orders;
drop policy if exists "Users create orders" on public.orders;
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Users view own order items" on public.order_items;
drop policy if exists "Users create order items" on public.order_items;
drop policy if exists "Users can view their own order items" on public.order_items;
drop policy if exists "Users can create order items" on public.order_items;

-- Products: anyone can read
create policy "Products are publicly visible"
  on public.products for select using (true);

-- Products: only admins can write
create policy "Admins manage products"
  on public.products for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Profiles: users manage their own
create policy "Users view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Orders: users see their own
create policy "Users view own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Users create orders"
  on public.orders for insert with check (auth.uid() = user_id);

-- Order items: users see their own
create policy "Users view own order items"
  on public.order_items for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );
create policy "Users create order items"
  on public.order_items for insert with check (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
