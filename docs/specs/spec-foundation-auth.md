# Spec: Foundation & Auth

> Created: 2026-06-19

Stands up the Expo + Supabase project, account auth, an own-row `profiles`
table, and a base navigation shell — the runnable foundation every later phase
builds on. This spec carries no lifecycle state — acceptance is the spec merged
on the default branch with a milestone and issues; progress lives in the GitHub
issues and milestone. A completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] A fresh clone bootstraps and runs: `npm ci && cp .env.example .env` →
      `npm run verify` passes and the Expo app launches on a simulator/device.
- [ ] `npm run verify` exists (`eslint . && tsc --noEmit`), runs green, and its
      measured duration is recorded in `docs/workflow.md`.
- [ ] A user can sign up, sign in, and sign out via Supabase Auth; the session
      persists across an app restart.
- [ ] A `profiles` table exists with RLS such that a user can read/write only
      their own row; it has **no `role` column**.
- [ ] After auth the app renders the owner/Flower home shell; unauthenticated
      users see the auth screen.
- [ ] `lib/data/` holds the only Supabase access path; `.env.example` lists
      every variable the project needs.
- [ ] The project layout matches `docs/architecture.md` (`features/`, `lib/`,
      `components/`, `supabase/migrations/`).

## Scope

### In scope

- Expo + TypeScript scaffold with Expo Router; ESLint + `tsc` config; the
  `verify` and `build` npm scripts named in the workflow contract.
- Supabase project wiring: a typed client in `lib/data/`, env loading, and a
  complete `.env.example`.
- Auth: sign-up, sign-in, sign-out, and session persistence (method resolved at
  the spec-acceptance gate).
- A `profiles` table + RLS (own-row read/write), created as a
  `supabase/migrations/` migration. No `role` column.
- A base navigation shell: an unauthenticated auth stack vs an authenticated app
  stack, with an owner/Flower home placeholder.
- README with bootstrap instructions; the existing GPL-3.0 LICENSE stays.

### Out of scope

- Cycle logging and its schema (Phase 2).
- The `pairing` edge table, the Mate shell, and data sovereignty (Phases 5/6) —
  Phase 1 establishes `profiles` with no role column; the role substrate's
  pairing edges land when pairing is built.
- Prediction, push, and Edge Functions (Phases 3/6).
- Profile-editing UI beyond the minimum needed to prove the table.

## Constraints

References `docs/constitution.md` rather than restating it.

- Roles are **never** a global account flag — no `profiles.role` column
  (constitution: edge-based role substrate). v1 navigation boots into the
  owner/Flower shell by default; the Mate shell is activated by a pairing edge
  in a later phase.
- Every table touching personal data ships an RLS policy (constitution).
- Components never call Supabase directly — only through `lib/data/`
  (architecture).
- TypeScript `strict` + `noUncheckedIndexedAccess`; no `any`; functions ≤ 50
  lines, files ≤ 300 (constitution).
- Local dev and schema via the Supabase CLI; migrations live in
  `supabase/migrations/` (architecture).

## Prior art

- [Privacy / data sovereignty](../prior-art.md#privacy--data-sovereignty) —
  Euki's no-account / data-minimization posture informs the auth-method decision
  (favor minimal identifiers); relevant to the genuinely-open auth choice below.
- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — the invite/companion flow (Flo for Partners) is built in Phase 5; noted here
  only so the auth/account model does not foreclose an invite-based pairing.

## Human prerequisites

- [ ] A Supabase project exists and `EXPO_PUBLIC_SUPABASE_URL` +
      `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present in `.env` (needed to wire auth
      and run the app). The `SUPABASE_SERVICE_ROLE_KEY` is **not** needed until
      Edge Functions arrive (Phase 6).
- [ ] An Expo / EAS account for `npm run build` (EAS). Local dev and
      `npm run verify` work without it; the build outcome is the only part that
      depends on it.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Expo Router (file-based) | Modern Expo default; maps cleanly onto the constitution's `features/` layout | 2026-06-19 |
| No `profiles.role` column; v1 boots the owner/Flower shell | Constitution mandates edge-based roles; the Mate shell activates via a pairing edge later (Phase 6) | 2026-06-19 |
| `lib/data/` is the sole Supabase access path | Architecture boundary | 2026-06-19 |
| `verify` = `eslint . && tsc --noEmit` | Workflow contract's per-iteration gate | 2026-06-19 |
| OPEN — auth method (email+password / magic link / anonymous) | resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Foundation & Auth (created on merge)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

Uses the workflow contract's Verify command. Test is `none yet`, so the
behavioral items below are the script for the human milestone-QA gate.

- [ ] `npm run verify` passes.
- [ ] Fresh `npm ci && cp .env.example .env` → app launches (UI smoke).
- [ ] Sign-up → sign-in → kill the app → reopen → still signed in.
- [ ] Sign-out returns to the auth screen.
- [ ] A second user cannot read the first user's `profiles` row (RLS smoke via
      SQL / two sessions).
- [ ] The `profiles` table has no `role` column (schema check).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Supabase project not provisioned blocks the milestone | Human prerequisite delivered at the acceptance gate; otherwise the affected issue is parked `blocked:human` |
| Auth-method churn after build starts | Decided at the acceptance gate before issues are created |
| Role concept leaks into a DB column out of convenience | Explicit constraint + verification check that no `role` column exists |

## Decision log

- 2026-06-19: Spec drafted; auth method left OPEN for the acceptance gate.
