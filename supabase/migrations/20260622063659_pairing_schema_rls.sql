-- Pairing & data sovereignty core (Phase 5). Three tables: the edge-based
-- `pairing`, the token-secured `invites`, and the owner-keyed derived
-- `shared_state` the follower may read. Roles are the DIRECTION of a pairing
-- edge (owner = tracked / Flower, follower = Mate), NEVER a global role flag
-- (constitution). The schema is n:m-capable; v1's single-follower is a UI guard,
-- not a DB constraint.
--
-- Security model (spec docs/specs/spec-pairing.md, "Security model (pinned)"):
--   * No direct `pairing` INSERT by anyone. The edge is created only inside a
--     SECURITY DEFINER accept_invite(token) function (a later issue). Here that
--     is enforced by granting NO insert and defining NO insert policy.
--   * `invites`: the owner manages their own rows; the token is stored hashed,
--     never plaintext. No client lookup of other owners' invites.
--   * `shared_state`: the owner writes their own row; a follower may SELECT it
--     only while paired on an ACTIVE edge (a separate, additive policy).
--   * `periods` / `daily_logs` (Phase 2/4) are untouched — the follower gets no
--     raw-log access. `shared_state` holds phase/attunement-level data only; no
--     raw health data (constitution: no raw health data in shared/derived
--     surfaces).

-- The pairing status. `active` is created directly by the accept RPC; revoke
-- flips it to `revoked` (history kept, no hard delete). There is no
-- client-visible `pending` pairing — pending lives on the `invites` row.
create type public.pairing_status as enum ('active', 'revoked');

-- ----------------------------------------------------------------------------
-- pairing: the owner <-> follower edge. The trust anchor every downstream grant
-- keys on. Role = direction of the edge, never a column flag.
-- ----------------------------------------------------------------------------
create table public.pairing (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references auth.users (id) on delete cascade,
  follower_id uuid not null references auth.users (id) on delete cascade,
  status public.pairing_status not null default 'active',
  created_at timestamptz not null default now(),
  check (owner_id <> follower_id)
);

-- At most one ACTIVE edge per (owner, follower) pair; revoked rows are exempt so
-- re-pairing after revoke creates a fresh active row alongside the kept history.
create unique index pairing_owner_follower_active_idx
  on public.pairing (owner_id, follower_id)
  where status = 'active';

-- Resolve a follower's active edges (used by the shared_state follower policy)
-- and an owner's edge list.
create index pairing_follower_id_status_idx
  on public.pairing (follower_id, status);

alter table public.pairing enable row level security;

-- Base privileges: both parties may read; only the owner may update (revoke) and
-- delete. INSERT is deliberately NOT granted — the edge is created only via the
-- SECURITY DEFINER accept RPC, closing the follower self-grant attack.
grant select, update, delete on public.pairing to authenticated;

-- Both parties to an edge can read it (the owner sees who follows them; the
-- follower sees whom they follow).
create policy "pairing_select_own_edge"
  on public.pairing
  for select
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = follower_id);

-- Only the owner can revoke (flip status) their own edges, and cannot reassign
-- the edge away from themselves.
create policy "pairing_update_owner"
  on public.pairing
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Only the owner can delete their own edges.
create policy "pairing_delete_owner"
  on public.pairing
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Note: no INSERT policy exists by design. With no insert grant and no insert
-- policy, no client (owner OR follower) can self-insert an edge; creation is
-- the accept RPC's sole responsibility.

-- ----------------------------------------------------------------------------
-- invites: a single-use, expiring, hashed token the owner generates and shares
-- out-of-band. The Mate types the code; the accept RPC hashes the input, finds
-- the matching unexpired/unused row, and marks it used. The plaintext token is
-- never stored.
-- ----------------------------------------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- The accept RPC resolves an invite by its token hash; index that lookup.
create index invites_token_hash_idx
  on public.invites (token_hash);

alter table public.invites enable row level security;

-- The owner manages their own invites. No SELECT of another owner's invites is
-- possible (the policies below are all owner-scoped); the accept RPC reads the
-- matching row under SECURITY DEFINER, not via a client SELECT.
grant select, insert, update, delete on public.invites to authenticated;

-- A user can read only their own invites (e.g. to show outstanding codes).
create policy "invites_select_own"
  on public.invites
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- A user can create only invites keyed to their own auth id.
create policy "invites_insert_own"
  on public.invites
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- A user can update only their own invites (e.g. invalidate / regenerate).
create policy "invites_update_own"
  on public.invites
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- A user can delete only their own invites.
create policy "invites_delete_own"
  on public.invites
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- shared_state: the owner-keyed DERIVED state the owner opts to share with the
-- follower. Phase/attunement level only -- no raw health data. `current_phase`
-- mirrors the prediction engine's Phase enum; `next_period_date` is a heads-up
-- date. The phase-typical attunement hint is derived from `current_phase` in the
-- Mate UI (Phase 6), not stored. Her raw mood stays in `daily_logs`.
-- ----------------------------------------------------------------------------
create table public.shared_state (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  current_phase text check (
    current_phase in ('menstrual', 'follicular', 'ovulation', 'luteal')
  ),
  next_period_date date,
  updated_at timestamptz not null default now()
);

alter table public.shared_state enable row level security;

-- The owner writes their own derived state; the follower only reads it (no
-- insert/update/delete grant for the follower path -- read is gated by RLS).
grant select, insert, update on public.shared_state to authenticated;

-- A user can read their own shared_state row.
create policy "shared_state_select_own"
  on public.shared_state
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- Separate, ADDITIVE policy: a follower may SELECT an owner's shared_state only
-- while an ACTIVE pairing edge links them. Revoke flips the edge to `revoked`,
-- so this stops matching and access is cut immediately. The owner-only policies
-- on periods/daily_logs are untouched -- this grants derived access only.
create policy "shared_state_select_active_follower"
  on public.shared_state
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pairing p
      where p.owner_id = shared_state.owner_id
        and p.follower_id = auth.uid()
        and p.status = 'active'
    )
  );

-- A user can insert only their own shared_state row.
create policy "shared_state_insert_own"
  on public.shared_state
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- A user can update only their own shared_state row, and cannot reassign it.
create policy "shared_state_update_own"
  on public.shared_state
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
