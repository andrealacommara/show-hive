-- Allowed users / collaborators with roles
create table if not exists public.allowed_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'member')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.allowed_users enable row level security;

-- Drop existing policies to avoid duplication errors
drop policy if exists allowed_users_select_self_or_admin on public.allowed_users;
drop policy if exists allowed_users_insert_admin_or_first on public.allowed_users;
drop policy if exists allowed_users_update_admin on public.allowed_users;
drop policy if exists allowed_users_delete_admin on public.allowed_users;

-- Select: admins see all, others see themselves
create policy allowed_users_select_self_or_admin
  on public.allowed_users for select
  using (
    auth.email() = email
    or exists (select 1 from public.allowed_users au where au.email = auth.email() and au.role = 'admin')
  );

-- Insert: admins can add; bootstrap allows first admin when table empty
create policy allowed_users_insert_admin_or_first
  on public.allowed_users for insert
  with check (
    exists (select 1 from public.allowed_users au where au.email = auth.email() and au.role = 'admin')
    or not exists (select 1 from public.allowed_users au where au.role = 'admin')
  );

-- Update: only admins
create policy allowed_users_update_admin
  on public.allowed_users for update
  using (exists (select 1 from public.allowed_users au where au.email = auth.email() and au.role = 'admin'))
  with check (exists (select 1 from public.allowed_users au where au.email = auth.email() and au.role = 'admin'));

-- Delete: only admins
create policy allowed_users_delete_admin
  on public.allowed_users for delete
  using (exists (select 1 from public.allowed_users au where au.email = auth.email() and au.role = 'admin'));

-- Ensure at least one admin always exists
create or replace function public.ensure_admin_exists()
returns trigger
language plpgsql
security definer
as $$
declare
  admin_count int;
begin
  if (tg_op = 'DELETE' and old.role = 'admin')
     or (tg_op = 'UPDATE' and old.role = 'admin' and new.role <> 'admin') then
    select count(*) into admin_count from public.allowed_users where role = 'admin' and id <> old.id;
    if admin_count = 0 then
      raise exception 'Deve esserci almeno un admin';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists ensure_admin_exists_trigger on public.allowed_users;
create trigger ensure_admin_exists_trigger
  before delete or update on public.allowed_users
  for each row
  execute function public.ensure_admin_exists();
