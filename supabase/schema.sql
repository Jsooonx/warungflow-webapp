create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  local_orders_imported boolean not null default false,
  beta_status text not null default 'pending',
  approved_batch integer,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_beta_status_check check (beta_status in ('pending', 'approved', 'waitlist', 'rejected'))
);

alter table public.profiles
  add column if not exists beta_status text not null default 'pending',
  add column if not exists approved_batch integer,
  add column if not exists approved_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_beta_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_beta_status_check
      check (beta_status in ('pending', 'approved', 'waitlist', 'rejected'));
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  whatsapp_number text not null,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  total_price numeric not null default 0 check (total_price >= 0),
  notes text not null default '',
  status text not null check (status in ('pending_payment', 'paid', 'packing', 'shipped', 'done', 'cancelled')),
  tracking_number text,
  invoice_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_number)
);

alter table public.orders
  add column if not exists invoice_sent_at timestamptz;

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('order_format', 'payment_confirmation', 'processing', 'shipping')),
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create table if not exists public.beta_approved_emails (
  email text primary key,
  approved_batch integer not null default 1,
  approved_at timestamptz not null default now(),
  notes text not null default ''
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  update public.profiles
  set beta_status = 'approved',
      approved_batch = beta_approved_emails.approved_batch,
      approved_at = beta_approved_emails.approved_at
  from public.beta_approved_emails
  where public.profiles.id = new.id
    and lower(public.beta_approved_emails.email) = lower(coalesce(new.email, ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.templates enable row level security;
alter table public.beta_approved_emails enable row level security;

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, local_orders_imported) on public.profiles to authenticated;

drop policy if exists "Profiles are user-owned" on public.profiles;
drop policy if exists "Profiles are selectable by owner" on public.profiles;
create policy "Profiles are selectable by owner"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Profiles limited update by owner" on public.profiles;
create policy "Profiles limited update by owner"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Orders are user-owned" on public.orders;
create policy "Orders are user-owned"
on public.orders
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Templates are user-owned" on public.templates;
create policy "Templates are user-owned"
on public.templates
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
