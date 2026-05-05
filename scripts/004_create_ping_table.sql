-- Create ping table for GitHub Actions keep-alive workflow
-- This table is pinged every 3 days by the keep-alive.yml workflow
-- to prevent Supabase free-tier projects from auto-pausing
create table public.ping (id bool default true);

insert into public.ping values (true);

alter table public.ping enable row level security;

create policy "public read" on public.ping for select using (true);
