-- periods: the owner-keyed raw cycle log. One row per logged period; a "cycle"
-- is derived from consecutive start_date values, never stored (spec). Dates are
-- DATE (local calendar day, no time) to avoid timezone drift. start_date may be
-- any past date (historical backfill); end_date is nullable (per-period).
--
-- This is a RAW LOG table: own-row RLS only (auth.uid() = owner_id) for the full
-- CRUD set. Followers get NO access of any kind here — follower visibility is
-- added in Phase 5 only via shared/derived views, never on this table
-- (constitution). No role / account-role column: roles live on the pairing edge.

create table public.periods (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

-- Index the owner-keyed history reads (chronological list, descending by date).
create index periods_owner_id_start_date_idx
  on public.periods (owner_id, start_date desc);

alter table public.periods enable row level security;

-- Base table privileges for the authenticated role; RLS (below) filters which
-- rows are actually visible/writable. The anon role gets nothing, and no other
-- role (no follower path) is granted on this raw log table.
grant select, insert, update, delete on public.periods to authenticated;

-- A user can read only their own period rows.
create policy "periods_select_own"
  on public.periods
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- A user can insert only rows keyed to their own auth id.
create policy "periods_insert_own"
  on public.periods
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- A user can update only their own rows, and cannot reassign ownership away.
create policy "periods_update_own"
  on public.periods
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- A user can delete only their own rows.
create policy "periods_delete_own"
  on public.periods
  for delete
  to authenticated
  using (auth.uid() = owner_id);
