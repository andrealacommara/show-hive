-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  google_calendar_token text,
  google_refresh_token text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create venues (locali) table
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.venues enable row level security;

-- Everyone can view venues
create policy "venues_select_all"
  on public.venues for select
  using (true);

-- Only creator can manage venues
create policy "venues_insert_own"
  on public.venues for insert
  with check (auth.uid() = created_by);

create policy "venues_update_own"
  on public.venues for update
  using (auth.uid() = created_by);

create policy "venues_delete_own"
  on public.venues for delete
  using (auth.uid() = created_by);

-- Create shifts (turni) table
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  google_calendar_event_id text,
  calendar_owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.shifts enable row level security;

-- Users can view all shifts
create policy "shifts_select_all"
  on public.shifts for select
  using (true);

-- Only creator can insert shifts
create policy "shifts_insert_own"
  on public.shifts for insert
  with check (auth.uid() = created_by);

-- Only creator can update shifts
create policy "shifts_update_own"
  on public.shifts for update
  using (auth.uid() = created_by);

-- Only creator can delete shifts
create policy "shifts_delete_own"
  on public.shifts for delete
  using (auth.uid() = created_by);

-- Create indexes for better performance
create index if not exists shifts_venue_id_idx on public.shifts(venue_id);
create index if not exists shifts_assigned_to_idx on public.shifts(assigned_to);
create index if not exists shifts_shift_date_idx on public.shifts(shift_date);
create index if not exists shifts_calendar_owner_idx on public.shifts(calendar_owner_id);
create index if not exists venues_created_by_idx on public.venues(created_by);

-- Ensure calendar owner column exists when migrating an existing DB
alter table public.shifts add column if not exists calendar_owner_id uuid references auth.users(id) on delete set null;

-- Create shift_assignees table for multiple assignees
create table if not exists public.shift_assignees (
  shift_id uuid references public.shifts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (shift_id, user_id)
);

alter table public.shift_assignees enable row level security;

-- Select: all users (coerent with shifts visibility)
drop policy if exists shift_assignees_select_all on public.shift_assignees;
create policy shift_assignees_select_all
  on public.shift_assignees for select
  using (true);

-- Insert/update/delete: only creator of the shift
drop policy if exists shift_assignees_modify_creator on public.shift_assignees;
create policy shift_assignees_modify_creator
  on public.shift_assignees for all
  using (
    exists (
      select 1 from public.shifts s
      where s.id = shift_id
      and s.created_by = auth.uid()
    )
  );

create index if not exists shift_assignees_user_id_idx on public.shift_assignees(user_id);
create index if not exists shift_assignees_shift_id_idx on public.shift_assignees(shift_id);
