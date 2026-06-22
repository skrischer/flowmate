-- daily_logs: the owner-keyed raw light mood log. One row per (owner_id, date);
-- a mood may be logged for any past date (historical backfill), so date is a
-- DATE (local calendar day, no time) to avoid timezone drift. mood is a single
-- value from a curated set of 6 (content, calm, sensitive, irritable, low,
-- anxious) — mood-only in v1; the USP is Gemuet, not a quantified-self tracker
-- (vision non-goal). Symptoms are addable later via an additive migration.
--
-- This is a RAW LOG table: own-row RLS only (auth.uid() = owner_id) for the full
-- CRUD set. Followers get NO access of any kind here — follower visibility is
-- added in a later phase only via shared/derived views, never on this table
-- (constitution). No role / account-role column: roles live on the pairing edge.

create table public.daily_logs (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood text not null check (
    mood in ('content', 'calm', 'sensitive', 'irritable', 'low', 'anxious')
  ),
  created_at timestamptz not null default now(),
  unique (owner_id, date)
);

-- Index the owner-keyed calendar reads (one user's moods, newest day first).
create index daily_logs_owner_id_date_idx
  on public.daily_logs (owner_id, date desc);

alter table public.daily_logs enable row level security;

-- Base table privileges for the authenticated role; RLS (below) filters which
-- rows are actually visible/writable. The anon role gets nothing, and no other
-- role (no follower path) is granted on this raw log table.
grant select, insert, update, delete on public.daily_logs to authenticated;

-- A user can read only their own daily-log rows.
create policy "daily_logs_select_own"
  on public.daily_logs
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- A user can insert only rows keyed to their own auth id.
create policy "daily_logs_insert_own"
  on public.daily_logs
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- A user can update only their own rows, and cannot reassign ownership away.
create policy "daily_logs_update_own"
  on public.daily_logs
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- A user can delete only their own rows.
create policy "daily_logs_delete_own"
  on public.daily_logs
  for delete
  to authenticated
  using (auth.uid() = owner_id);
