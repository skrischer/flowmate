# Spec: Cycle logging & history

> Created: 2026-06-19

Establishes the owner-keyed cycle-logging schema with own-row RLS, the typed
`lib/data/` CRUD for it, and a basic logging + history flow for the Flower — the
cycle data every later phase (prediction, sharing) reads from. This spec carries
no lifecycle state — acceptance is the spec merged on the default branch with a
milestone and issues; progress lives in the GitHub issues and milestone. A
completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] An owner-keyed cycle-logging schema exists with RLS such that a user can
      read/write only their own entries (no `role` flag; `owner_id =
      auth.uid()`).
- [ ] The Flower can log a period, edit it, and delete it (create / update /
      delete).
- [ ] A chronological history view lists the logged entries.
- [ ] `lib/data/` exposes typed CRUD for the cycle tables; components make no
      direct Supabase calls.
- [ ] `npm run verify` passes and the migration applies cleanly to the local
      Supabase stack.

## Scope

### In scope

- A `supabase/migrations/` migration creating the owner-keyed cycle-logging
  table with own-row RLS policies (`owner_id = auth.uid()` for select / insert /
  update / delete). Table: `periods(owner_id, start_date, end_date)` — `end_date`
  nullable (per-period, decided at the gate).
- Typed CRUD in `lib/data/` for logging entries.
- A "log period" flow (create) plus edit and delete of a logged entry.
- A basic chronological history list, **descending by date**; no pagination in v1.
- Phase 2 UI is exclusively the **Flower's** logging flow; the Mate has no view
  in this phase (the Mate experience is Phase 6).

### Out of scope

- Prediction, phases, and the fertile window (Phase 3) — this phase only stores
  and lists raw logged data.
- Calendar / phase visualization and mood/symptom logging (Phase 4).
- Pairing and follower read access (Phase 5) — RLS here is **owner-only**; the
  follower SELECT policies via shared views are added when pairing is built.

## Constraints

References `docs/constitution.md` rather than restating it.

- Cycle data is **owner-keyed**; every cycle table carries `owner_id` from day
  one so Phase 5 can extend SELECT to followers without a backfill (constitution:
  edge-based substrate, n:m-capable).
- RLS in this phase is **own-row only** (`owner_id = auth.uid()`). Phase 5 adds a
  **separate additional** SELECT policy for follower access via shared views; the
  owner-only SELECT policy written here is **not** modified or replaced.
- A "cycle" is a **derived** concept, not a stored row: cycle length is computed
  from consecutive `periods.start_date` values. With per-period granularity no
  grouping mechanism is needed — Phase 3 reads `periods` directly.
- Logged days are stored as `DATE` (local calendar day, no time) to avoid
  timezone drift.
- Components never call Supabase directly — only through `lib/data/`; TS
  `strict` + `noUncheckedIndexedAccess: true`, no `any`, functions ≤ 50 lines,
  files ≤ 300 (constitution).
- Migrations live in `supabase/migrations/`, applied via the Supabase CLI.

## Prior art

- [Fertile-window & cycle prediction](../prior-art.md#fertile-window--cycle-prediction)
  — drip's bleeding-day logging model is the reference for the per-day
  granularity option below.
- [Privacy / data sovereignty](../prior-art.md#privacy--data-sovereignty) —
  data minimization: store only what prediction and history need.

## Human prerequisites

- None — v1 runs on the local Supabase stack from Phase 1; no secrets or external
  provisioning for this phase.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Owner-keyed tables; own-row RLS (`owner_id = auth.uid()`) | Constitution edge-based substrate; follower access added in Phase 5 as a separate SELECT policy, no backfill | 2026-06-19 |
| A "cycle" is derived, not stored — length computed from consecutive period starts | Avoids denormalized/stale length; Phase 3 reads raw entries | 2026-06-19 |
| Logged days stored as `DATE` (local), no timestamps | Avoids timezone drift on a calendar-day concept | 2026-06-19 |
| The Flower can edit/delete her entries (full CRUD) | Data sovereignty — she owns and corrects her data | 2026-06-19 |
| Logging granularity = **per-period**: `periods(owner_id, start_date, end_date)`; the edit unit is one period row's start/end. Per-day/intensity deferred. | Faithful to the pitch's minimal-effort "log the start" promise; sufficient for prediction; per-day/intensity can be added later without a backfill | 2026-06-19 |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Cycle logging & history (created on merge; `Depends on milestone: #1`)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

Uses the workflow contract's Verify command. Test is `none yet`, so the
behavioral items below are the script for the human milestone-QA gate.

- [ ] `npm run verify` passes; the migration applies to the local stack
      (`supabase migration up`).
- [ ] Log a period → it appears in the history list.
- [ ] Edit a logged entry → the change persists.
- [ ] Delete a logged entry → it disappears from the history list.
- [ ] A second user cannot read the first user's entries (RLS smoke via SQL /
      two sessions).
- [ ] No cycle table has a `role` column; every cycle table has `owner_id` +
      RLS (schema check).
- [ ] No `createClient` / direct Supabase import exists outside `lib/data/`
      (grep — same check as Phase 1).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Granularity churn after build starts | Decided at the acceptance gate before issues are created |
| Schema not future-proof for Phase 5 follower views | `owner_id` on every cycle table from day one; SELECT policies written to be extendable, not rewritten |
| Date/timezone bugs on the logged day | Store `DATE` only (no time); never a timestamp for the calendar day |

## Decision log

- 2026-06-19: Spec drafted; logging granularity left OPEN for the acceptance gate.
- 2026-06-19: Addressed spec review (PR #9) — pinned "cycle is derived, not stored";
  tied the edit unit to the granularity decision; added `noUncheckedIndexedAccess`;
  pinned Phase 5's RLS extension as a separate SELECT policy; named candidate
  tables; set history sort descending; scoped Phase 2 UI to the Flower only.
- 2026-06-19: Acceptance gate — granularity = per-period (`periods` table); spec
  accepted and merged.
