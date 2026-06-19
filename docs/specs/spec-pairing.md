# Spec: Pairing & data sovereignty

> Created: 2026-06-19

The USP core: an edge-based `pairing` between a Flower (owner) and a Mate
(follower), a **token-secured** invite/accept flow, an owner-controlled derived
`shared_state` the follower may read (never the raw logs), and revoke that cuts
access immediately. This spec carries no lifecycle state — acceptance is the spec
merged on the default branch with a milestone and issues; progress lives in the
GitHub issues and milestone. A completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] A `pairing` edge table (owner ↔ follower, status) exists; there is **no**
      `profiles.role` flag anywhere.
- [ ] The Flower creates a single-use, expiring invite; the Mate accepts it via a
      server-validated RPC; a pairing edge is created. A follower **cannot**
      self-insert a pairing edge.
- [ ] The follower can read the owner's derived `shared_state` while the pairing
      is active — and **cannot** read or write the raw `periods` / `daily_logs`,
      nor write `shared_state`.
- [ ] The Flower can **revoke**: the follower's `shared_state` access is cut
      immediately.
- [ ] `npm run verify` + `npm test` pass.

## Scope

### In scope

- Migrations for the **edge-based, n:m-capable** schema (v1 UI is 1:1):
  - `pairing(owner_id, follower_id, status, created_at)`.
  - `invites(id, owner_id, token_hash, expires_at, used_at)`.
  - `shared_state(owner_id, current_phase, next_period_date, updated_at)` — the
    derived current phase + a next-period heads-up. The phase-typical attunement
    hint is derived from `current_phase` in the Mate UI (Phase 6), **not stored**;
    her raw mood stays in `daily_logs` (follower-inaccessible).
- The token-secured invite flow (UX form factor at the gate) + the
  `accept_invite(token)` RPC.
- The owner-side write path that updates `shared_state` from `lib/prediction`.
- Revoke.
- Typed CRUD / RPC wrappers in `lib/data/`.

### Out of scope

- The Mate's UI rendering of `shared_state` and Expo Push (Phase 6).
  **Phase 6 precondition (carried from here):** the Mate UI must not persist
  `shared_state` offline beyond a session — revoke cuts the source, and a cached
  copy would defeat it.
- Multiple simultaneous Mates / mixed-calendar n:m UI (Phase 8).
- Any follower write path — the follower is read-only by construction.
- **Follower-initiated "leave connection"** — in v1 only the owner (Flower) ends a
  pairing (revoke). The Mate has no self-exit path; sovereignty is deliberately
  one-directional. A follower-initiated leave is deferred to Phase 8 (mutual
  pairing), where each person is both subject and observer.

## Security model (pinned)

The trust anchor is the `pairing` edge; every downstream grant keys on it, so it
is locked down here, not at the gate.

- **No direct `pairing` INSERT by anyone.** The edge is created **only** inside a
  `SECURITY DEFINER` `accept_invite(token)` function that: hashes the token,
  finds a matching `invites` row that is unexpired and unused, then inserts
  `pairing(owner_id = invite.owner_id, follower_id = auth.uid(), status =
  'active')` and marks the invite `used_at`. This closes the self-grant attack.
- **`invites`:** the owner INSERTs (`owner_id = auth.uid()`); the token is random,
  **single-use**, **expiring**, and stored **hashed** (never plaintext). No
  client SELECT of other owners' invites; lookup happens inside the RPC only.
- **`pairing` RLS:** SELECT where `owner_id = auth.uid() OR follower_id =
  auth.uid()` (both parties see their own edge); **INSERT denied** to clients
  (RPC only); UPDATE (revoke) where `owner_id = auth.uid()`; DELETE where
  `owner_id = auth.uid()`.
- **`shared_state` RLS:** INSERT/UPDATE where `owner_id = auth.uid()` (only the
  owner writes their own state); SELECT where `owner_id = auth.uid()` **OR** a
  **separate additional** policy: an active `pairing` edge exists with that
  `owner_id` and `follower_id = auth.uid()`.
- **`periods` / `daily_logs`:** owner-only policies from Phase 2/4 are
  **unchanged** — the follower has no access. (Phase 6 adds derived access only;
  it must not grant raw access.)
- **Revoke** flips the pairing `status` to `revoked`; the `shared_state` follower
  policy matches only `active`, so access stops immediately. History is
  preserved (no hard delete).
- **`status` enum = `active | revoked`** (acceptance via RPC yields `active`
  directly; there is no client-visible `pending` pairing — pending lives on the
  `invites` row). A **partial unique index** on `(owner_id, follower_id) WHERE
  status = 'active'` prevents duplicate active edges for the same pair while
  staying n:m-capable.
- **Re-pairing** after revoke: a new invite → a new `active` row (the old stays
  `revoked`); allowed by the partial unique index.

## Constraints

References `docs/constitution.md` rather than restating it.

- Roles are the pairing edge's direction; **no `profiles.role`** (constitution).
- The follower has **no SELECT on raw `periods` / `daily_logs`** — only
  `shared_state` (constitution: derived views only, never raw logs). Verified.
- The follower SELECT on `shared_state` is a **separate additive** RLS policy
  keyed on an **active** pairing edge — the owner-only policies on
  `periods`/`daily_logs` are untouched (honors Phase 2/4's promise).
- `shared_state` is **derived**, written by the owner's client via
  `lib/prediction` (no prediction logic in SQL).
- Schema **n:m-capable**; v1 single-follower is a UI guard, not a DB 1:1.
- Components never call Supabase directly — only `lib/data/`; TS `strict` +
  `noUncheckedIndexedAccess`, no `any`, functions ≤ 50 lines, files ≤ 300.

## Prior art

- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — Flo for Partners' invite/companion flow (ADOPT); the read-only failure modes
  (AVOID) inform the follower-reads-derived-only model.
- [Privacy / data sovereignty](../prior-art.md#privacy--data-sovereignty) — the
  revoke + minimal-shared-state posture.

## Human prerequisites

- None (local Supabase stack).

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Pairing created only via `SECURITY DEFINER accept_invite(token)`; no client `pairing` INSERT | Closes the follower self-grant attack | 2026-06-19 |
| `invites` token: random, single-use, expiring, stored hashed | Prevents brute-force / replay / enumeration | 2026-06-19 |
| Full RLS enumerated for `pairing`, `invites`, `shared_state` (see Security model) | Trust anchor must be fully locked, not partial | 2026-06-19 |
| `shared_state` write requires `owner_id = auth.uid()`; follower read via separate active-pairing policy | Only the owner writes; follower reads derived-only | 2026-06-19 |
| `status` = `active` / `revoked`; revoke = flip to `revoked` (history kept); re-pair = new active row | Immediate cut; auditable; re-pairing supported | 2026-06-19 |
| Partial unique index `(owner_id, follower_id) WHERE status='active'`; n:m-capable, v1 1:1 by UI | No duplicate active edges; future Phase 8 without backfill | 2026-06-19 |
| Invite UX = short **code** (hashed, single-use, 24h expiry) the owner shares out-of-band; the Mate types it | Local-friendly; no deep-link config or QR dependency (minimal-deps) | 2026-06-19 |
| `shared_state` = `current_phase` + `next_period_date` heads-up + a phase-derived attunement hint (not her raw mood) | Vision-aligned attunement; her actual mood stays in `daily_logs`, follower-inaccessible | 2026-06-19 |
| Revoke is **Flower-only** in v1; the Mate has no self-exit path (sovereignty deliberately one-directional) | Vision: the Mate is an invited companion, never a co-manager; follower-initiated leave is a Phase 8 concern | 2026-06-19 |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone.

- Milestone: Pairing & data sovereignty (created on merge; `Depends on milestone: #1, #4`)
- Issues: created from this spec once it is merged (one per implementable step)
- Design: `docs/design.md` (Heather · Dark) — surfaces: Invite-Code (incl.
  expired/used + "neuen Code generieren" states), Code-eingeben (Mate accept
  screen → `accept_invite`), Pairing-Management (on the Profil "Mein Mate" row —
  connected status, "Mate entfernen"/revoke, re-invite)

## Verification

Uses the workflow contract's Verify + Test commands.

- [ ] `npm run verify` + `npm test` pass.
- [ ] Invite → accept (via RPC) → an `active` pairing edge is created.
- [ ] A follower **cannot** INSERT a `pairing` edge directly to any owner (RLS
      smoke — must fail); pairing is created only via the RPC.
- [ ] An invalid / expired / already-used token is rejected by `accept_invite`.
- [ ] While active, the follower SELECTs `shared_state` for `owner_id = <owner>`
      and gets exactly that owner's row (not their own, not another's).
- [ ] The follower **cannot** SELECT `periods` or `daily_logs` (RLS smoke — fail).
- [ ] The follower **cannot** INSERT/UPDATE `shared_state`, `periods`, or
      `daily_logs` for an owner (RLS smoke — fail).
- [ ] Revoke → the follower's `shared_state` SELECT fails immediately.
- [ ] No `profiles.role` column exists (schema check).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `shared_state` goes stale if the owner does not open the app | v1: owner client refreshes `shared_state` on app open and on log; staleness window documented; server-side recompute is a later improvement |
| Over-sharing leaks raw cycle data to the follower | `shared_state` holds only the gate-decided derived fields; verification proves no raw-table access |
| Revoke leaves a readable cache on the follower device | Phase 6 precondition (above): the Mate UI must not persist `shared_state` offline beyond a session |
| `SECURITY DEFINER` function over-privileged | The function does exactly one thing (validate token + insert one edge + mark used); reviewed for injection and scoped to its tables |

## Decision log

- 2026-06-19: Spec drafted; invite mechanism and `shared_state` content left OPEN.
- 2026-06-19: Addressed security review (PR #29) — pinned the full security model
  (token-secured `invites` + `SECURITY DEFINER accept_invite` RPC, no client
  `pairing` INSERT, full RLS for `pairing`/`invites`/`shared_state` incl. write
  auth, `status` enum, partial unique index, re-pairing); added attack-path
  verification (self-insert denied, shared_state write denied, correct-row read,
  token rejection); narrowed the OPEN items to the invite UX form factor and the
  `shared_state` content.
- 2026-06-19: Acceptance gate — invite = short code (hashed/single-use/24h);
  `shared_state` = phase + next-period heads-up + phase-derived attunement hint
  (no raw mood shared); spec accepted and merged.
- 2026-06-19: Design-coherence pass — pinned the missing Flower-side surfaces
  (Code-eingeben, Pairing-Management with revoke/re-invite, Invite regenerate +
  expired/used states); recorded follower-initiated leave as out of scope for v1
  (Flower-only revoke; Phase 8 concern).
