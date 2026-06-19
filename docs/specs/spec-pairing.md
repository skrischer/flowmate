# Spec: Pairing & data sovereignty

> Created: 2026-06-19

The USP core: an edge-based `pairing` between a Flower (owner) and a Mate
(follower), an invite/accept flow, an owner-controlled derived `shared_state` the
follower may read (never the raw logs), and revoke that cuts access immediately.
This spec carries no lifecycle state — acceptance is the spec merged on the
default branch with a milestone and issues; progress lives in the GitHub issues
and milestone. A completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] A `pairing` edge table exists (owner ↔ follower) with a status; there is
      **no** `profiles.role` flag anywhere.
- [ ] The Flower can invite a Mate, the Mate can accept, and a pairing edge is
      created.
- [ ] The follower can read the owner's **derived `shared_state`** while the
      pairing is active — and **cannot** read the raw `periods` or `daily_logs`
      tables at all.
- [ ] The Flower can **revoke**: the follower's access to `shared_state` is cut
      immediately (RLS).
- [ ] `shared_state` is written by the owner's client (derived via
      `lib/prediction`), owner-keyed; the follower SELECTs it via a **separate**
      RLS policy keyed on active pairing membership.
- [ ] `npm run verify` + `npm test` pass.

## Scope

### In scope

- A `pairing(owner_id, follower_id, status, created_at)` migration — edge-based,
  **n:m-capable** schema (a person may be owner on some edges, follower on
  others); v1 UI enforces one active follower per owner.
- Invite → accept flow (mechanism decided at the gate).
- A `shared_state` derived table (owner-keyed) holding the attunement data the
  follower may see (content decided at the gate), with:
  - a **separate additional** SELECT policy granting an active follower read
    access (the owner-only policies on `periods` / `daily_logs` are untouched);
  - an owner-side write path that updates `shared_state` from `lib/prediction`
    when the relevant inputs change.
- Revoke (owner sets the pairing inactive → follower SELECT fails immediately).
- Typed CRUD / queries in `lib/data/`.

### Out of scope

- The Mate's UI rendering of `shared_state` and Expo Push (Phase 6) — Phase 5
  establishes the data + access; Phase 6 consumes and notifies.
- Multiple simultaneous Mates / mixed-calendar n:m UI (Phase 8) — the schema is
  n:m-capable but v1 UI is 1:1.
- Any follower write path — the follower is read-only by construction.

## Constraints

References `docs/constitution.md` rather than restating it.

- Roles are the pairing edge's direction (`owner_id` / `follower_id`); **no
  `profiles.role`** (constitution).
- The follower has **no SELECT on the raw `periods` / `daily_logs` tables** —
  only on `shared_state` (constitution: a follower reads shared/derived views
  only, never raw logs). This is verified, not assumed.
- The follower SELECT on `shared_state` is a **separate additional** RLS policy
  keyed on an **active** pairing edge; revoke flips the edge inactive and the
  policy stops matching — no policy rewrite.
- `shared_state` is **derived**, written by the owner's client via
  `lib/prediction` (the engine stays the single source; no prediction logic in
  SQL).
- The schema is **n:m-capable**; v1 UI guards a single active pairing per owner
  (not a DB-enforced 1:1).
- Components never call Supabase directly — only `lib/data/`; TS `strict` +
  `noUncheckedIndexedAccess`, no `any`, functions ≤ 50 lines, files ≤ 300.

## Prior art

- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — Flo for Partners' invite/companion flow (ADOPT) and the "read-only,
  view-only" failure modes (AVOID) inform the invite flow and the
  follower-reads-derived-only model.
- [Privacy / data sovereignty](../prior-art.md#privacy--data-sovereignty) — the
  revoke + minimal-shared-state posture.

## Human prerequisites

- None (local Supabase stack).

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| `pairing(owner_id, follower_id, status, created_at)` edge table; no `profiles.role` | Constitution edge-based substrate, n:m-capable | 2026-06-19 |
| Follower reads only `shared_state`, never raw `periods` / `daily_logs` | Constitution: follower sees derived views only; the Mate is informed, not surveilling | 2026-06-19 |
| Follower SELECT = separate RLS policy on active pairing; revoke = inactive edge | No policy rewrite; immediate cut (matches Phase 2/4 extension model) | 2026-06-19 |
| `shared_state` written by the owner client via `lib/prediction` | Engine is the single source; no prediction logic duplicated in SQL | 2026-06-19 |
| Schema n:m-capable; v1 UI enforces one active follower per owner | Future Phase 8 without a backfill; v1 stays 1:1 | 2026-06-19 |
| OPEN — invite mechanism: invite code vs link vs QR | resolved at the spec-acceptance gate | — |
| OPEN — `shared_state` content (what the Mate sees): phase only / + current mood / + next-period heads-up | the core data-sovereignty decision; resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Pairing & data sovereignty (created on merge; `Depends on milestone: #1, #4`)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

Uses the workflow contract's Verify + Test commands.

- [ ] `npm run verify` + `npm test` pass.
- [ ] Invite → accept → a pairing edge is created (status active).
- [ ] While active, the follower can SELECT the owner's `shared_state`.
- [ ] The follower **cannot** SELECT the owner's `periods` or `daily_logs`
      (RLS smoke — must fail).
- [ ] Revoke → the follower's `shared_state` SELECT fails immediately.
- [ ] The follower has no write path to any owner table (RLS smoke — INSERT/
      UPDATE fail).
- [ ] No `profiles.role` column exists (schema check).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `shared_state` goes stale if the owner does not open the app (phase advances by calendar) | v1: owner client refreshes `shared_state` on app open and on log; staleness window documented; a server-side recompute is a later improvement, not v1 |
| Over-sharing leaks raw cycle data to the follower | `shared_state` holds only the gate-decided derived fields; verification proves no raw-table access |
| Revoke leaves a readable cache on the follower device | Follower data is fetched, not owned; revoke cuts the source; document that the Mate UI must not persist `shared_state` offline beyond a session (Phase 6) |

## Decision log

- 2026-06-19: Spec drafted; invite mechanism and `shared_state` content left OPEN
  for the acceptance gate.
