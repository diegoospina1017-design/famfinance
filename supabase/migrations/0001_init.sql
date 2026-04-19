-- famfinance initial schema
-- Run against a fresh Supabase project. Enable Email auth in Supabase dashboard first.

create extension if not exists "pgcrypto";

-- Households: the shared space for a couple / family
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- Profiles: 1-1 with auth.users, joined to a household
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  color text not null default '#22d3ee',
  budget_monthly numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind text not null check (kind in ('expense','income')),
  split text not null default 'personal' check (split in ('personal','shared')),
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_household_date_idx
  on public.transactions (household_id, date desc);
create index if not exists transactions_category_idx
  on public.transactions (category_id);

-- Helper: is the current user a member of household X?
create or replace function public.is_household_member(h uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and household_id = h
  );
$$;

-- RLS
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Profiles: a user can read their own profile, and read profiles of their household
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (
    id = auth.uid() or (household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());

-- Households: readable to members; any authenticated user can create one
drop policy if exists "households_member_read" on public.households;
create policy "households_member_read" on public.households
  for select using (public.is_household_member(id));

drop policy if exists "households_auth_insert" on public.households;
create policy "households_auth_insert" on public.households
  for insert with check (auth.uid() is not null);

drop policy if exists "households_member_update" on public.households;
create policy "households_member_update" on public.households
  for update using (public.is_household_member(id));

-- Categories: members only
drop policy if exists "categories_member_all" on public.categories;
create policy "categories_member_all" on public.categories
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Transactions: members only; user can only insert their own user_id
drop policy if exists "transactions_member_read" on public.transactions;
create policy "transactions_member_read" on public.transactions
  for select using (public.is_household_member(household_id));

drop policy if exists "transactions_member_insert" on public.transactions;
create policy "transactions_member_insert" on public.transactions
  for insert with check (
    public.is_household_member(household_id) and user_id = auth.uid()
  );

drop policy if exists "transactions_owner_update" on public.transactions;
create policy "transactions_owner_update" on public.transactions
  for update using (user_id = auth.uid() and public.is_household_member(household_id));

drop policy if exists "transactions_owner_delete" on public.transactions;
create policy "transactions_owner_delete" on public.transactions
  for delete using (user_id = auth.uid() and public.is_household_member(household_id));

-- Convenience view: shared-split balance per member in a household.
-- Positive paid_share_delta => others owe this user; negative => this user owes.
create or replace view public.shared_balances as
with shared as (
  select
    t.household_id,
    t.user_id,
    t.amount,
    count(*) over (partition by t.household_id) as _
  from public.transactions t
  where t.split = 'shared' and t.kind = 'expense'
),
paid as (
  select household_id, user_id, sum(amount) as paid
  from shared
  group by household_id, user_id
),
total as (
  select household_id, sum(amount) as total_shared
  from shared
  group by household_id
),
members as (
  select household_id, count(*)::numeric as n
  from public.profiles
  where household_id is not null
  group by household_id
)
select
  p.household_id,
  p.user_id,
  p.paid,
  (t.total_shared / nullif(m.n, 0)) as fair_share,
  p.paid - (t.total_shared / nullif(m.n, 0)) as net
from paid p
join total t using (household_id)
join members m using (household_id);
