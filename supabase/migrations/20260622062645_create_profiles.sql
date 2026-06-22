-- profiles: one row per authenticated user, keyed to auth.users.
-- Minimal account-facing fields only. No role / account-role column of any
-- kind: roles live on the pairing edge (owner/follower), never on profiles
-- (constitution). Own-row RLS so a user can see and write only their own row.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Base table privileges for the authenticated role; RLS (below) filters which
-- rows are actually visible/writable. The anon role gets nothing — profiles is
-- only reachable once signed in.
grant select, insert, update on public.profiles to authenticated;

-- A user can read only their own row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- A user can insert only a row keyed to their own auth id.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- A user can update only their own row, and cannot reassign it away.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
