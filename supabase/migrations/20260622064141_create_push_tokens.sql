-- push_tokens: each user owns their own row holding the Expo push token of
-- their device, plus an on/off toggle. The Mate registers here so the
-- phase-change dispatcher (a later issue) can deliver a push; nothing else
-- about a user's cycle lives here -- this table carries NO raw health data
-- (constitution). Roles are NOT stored here: this is plain self-ownership keyed
-- to auth.users, not a pairing-edge or account-role flag.
--
-- Security model: own-row RLS (auth.uid() = user_id) for the full self-managed
-- CRUD set -- a user reads/writes only their own token row. The service role
-- (used by the Edge Function dispatcher, a later issue) bypasses RLS to read a
-- recipient's token; no authenticated client can read another user's token.
--
-- user_id is the PRIMARY KEY: one device token row per user in v1, so
-- register/refresh is an UPSERT on user_id (a refreshed token replaces the old
-- one rather than accumulating stale rows).

create table public.push_tokens (
  id uuid not null default gen_random_uuid (),
  user_id uuid primary key references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

-- Base table privileges for the authenticated role; RLS (below) filters which
-- rows are actually visible/writable. The anon role gets nothing -- a token is
-- only registrable once signed in.
grant select, insert, update, delete on public.push_tokens to authenticated;

-- A user can read only their own token row.
create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

-- A user can insert only a row keyed to their own auth id.
create policy "push_tokens_insert_own"
  on public.push_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- A user can update only their own row, and cannot reassign it away.
create policy "push_tokens_update_own"
  on public.push_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user can delete only their own row.
create policy "push_tokens_delete_own"
  on public.push_tokens
  for delete
  to authenticated
  using (auth.uid() = user_id);
