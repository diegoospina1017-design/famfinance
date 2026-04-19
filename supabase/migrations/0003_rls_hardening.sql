-- Refuerza grants y scope de políticas RLS para evitar que fallen
-- inserciones desde el cliente autenticado.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.shared_balances to authenticated;

-- Re-crea políticas con role explícito (authenticated).
drop policy if exists "households_member_read" on public.households;
create policy "households_member_read" on public.households
  for select to authenticated using (public.is_household_member(id));

drop policy if exists "households_auth_insert" on public.households;
create policy "households_auth_insert" on public.households
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "households_member_update" on public.households;
create policy "households_member_update" on public.households
  for update to authenticated using (public.is_household_member(id));

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select to authenticated using (
    id = auth.uid() or (household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (id = auth.uid());

drop policy if exists "categories_member_all" on public.categories;
create policy "categories_member_all" on public.categories
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "transactions_member_read" on public.transactions;
create policy "transactions_member_read" on public.transactions
  for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "transactions_member_insert" on public.transactions;
create policy "transactions_member_insert" on public.transactions
  for insert to authenticated with check (
    public.is_household_member(household_id) and user_id = auth.uid()
  );

drop policy if exists "transactions_owner_update" on public.transactions;
create policy "transactions_owner_update" on public.transactions
  for update to authenticated using (user_id = auth.uid() and public.is_household_member(household_id));

drop policy if exists "transactions_owner_delete" on public.transactions;
create policy "transactions_owner_delete" on public.transactions
  for delete to authenticated using (user_id = auth.uid() and public.is_household_member(household_id));
