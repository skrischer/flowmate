# Spec: Foundation & Auth

> Created: 2026-06-19

Stands up the Expo + local-Supabase project, account auth (email + password), an
own-row `profiles` table, a base navigation shell, and a single command that runs
the app in an Android emulator on the Windows host via WSLg — the locally
runnable foundation every later phase builds on. This spec carries no lifecycle
state — acceptance is the spec merged on the default branch with a milestone and
issues; progress lives in the GitHub issues and milestone. A completed spec is
moved to `docs/specs/archive/`.

## Outcome

- [ ] A fresh clone bootstraps and runs locally: `npm ci && cp .env.example .env
      && supabase start` → `npm run verify` passes and `npm run android` launches
      the app in an Android emulator on the Windows host via WSLg.
- [ ] `npm run verify` exists (`eslint . && tsc --noEmit`), runs green, and its
      measured duration is recorded in `docs/workflow.md`.
- [ ] The app runs against the **local Supabase stack** (`supabase start`); no
      hosted project is required for v1.
- [ ] A user can sign up, sign in, and sign out via Supabase Auth (email +
      password); the session persists across an app restart.
- [ ] A `profiles` table exists with RLS such that a user can read/write only
      their own row; it has **no `role` column**.
- [ ] After auth the app renders the owner/Flower home shell; unauthenticated
      users see the auth screen.
- [ ] A read-only profile screen renders the authenticated user's `profiles` row.
- [ ] `lib/data/` holds the only Supabase access path; `.env.example` lists
      every variable the project needs.
- [ ] The project layout matches `docs/architecture.md` (`features/`, `lib/`,
      `components/`, `supabase/migrations/`).

## Scope

### In scope

- Expo + TypeScript scaffold with Expo Router; ESLint + `tsc` config; the
  `verify` and `build` npm scripts named in the workflow contract.
- The `npm run android` run command: launches an Android emulator visible on the
  Windows host via WSLg and runs the app in it (the v1 local-test loop).
- Local Supabase stack wiring: `supabase/config.toml`, a typed client in
  `lib/data/` pointed at the local stack, env loading, and a complete
  `.env.example`.
- Auth: sign-up, sign-in, sign-out, and session persistence (email + password).
- A `profiles` table + RLS (own-row read/write), created as a
  `supabase/migrations/` migration. No `role` column.
- A base navigation shell: an unauthenticated auth stack vs an authenticated app
  stack, with an owner/Flower home placeholder.
- A read-only profile screen rendering the authenticated user's `profiles` row —
  the minimum that proves the table + RLS end-to-end; no edit form.
- README with bootstrap + local-run instructions; the existing GPL-3.0 LICENSE
  stays.

### Out of scope

- Cycle logging and its schema (Phase 2).
- The `pairing` edge table and data sovereignty (Phase 5), and the Mate shell +
  push (Phase 6) — Phase 1 establishes `profiles` with no role column; the role
  substrate's pairing edges land in Phase 5.
- Prediction, push, and Edge Functions (Phases 3/6).
- A profile **edit** form — Phase 1 displays the row read-only only.
- **Live operation** — a hosted Supabase project, production env, EAS builds, and
  app-store / F-Droid distribution are a Phase 7 concern (planned later, not a v1
  gate). v1's bar is local testability.
- iOS: no iOS simulator runs on Windows/WSL; v1 local testing targets the Android
  emulator. iOS is exercised later via EAS / macOS.

## Constraints

References `docs/constitution.md` rather than restating it.

- v1 runs entirely against the **local Supabase stack** (Docker, `supabase
  start`) and an Android emulator via WSLg — no hosted services required to run
  or test it.
- Roles are **never** a global account flag — no `profiles.role` column
  (constitution: edge-based role substrate). v1 navigation boots into the
  owner/Flower shell by default; the Mate shell is activated by a pairing edge
  in a later phase.
- **Every** table introduced in this phase that touches personal data ships an
  RLS policy — not only `profiles` (constitution). If session persistence or
  device registration needs a helper table, it gets RLS too.
- Components never call Supabase directly — only through `lib/data/`
  (architecture).
- TypeScript `strict` + `noUncheckedIndexedAccess`; no `any`; functions ≤ 50
  lines, files ≤ 300 (constitution).
- Local dev and schema via the Supabase CLI; migrations live in
  `supabase/migrations/` (architecture).

## Prior art

- [Privacy / data sovereignty](../prior-art.md#privacy--data-sovereignty) —
  Euki's no-account / data-minimization posture was weighed for the auth method;
  email + password was chosen over anonymous for recoverability of her data.
- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — the invite/companion flow (Flo for Partners) is built in Phase 5; noted here
  only so the auth/account model does not foreclose an invite-based pairing.

## Human prerequisites

Local environment readiness only — no secrets, because v1 uses the local Supabase
stack. The hosted-project keys are a Phase 7 (live) concern.

- [ ] Docker and the Supabase CLI are installed; `supabase start` brings up the
      local stack (the implementer can install the CLI, but Docker must be
      available on the machine).
- [ ] KVM / nested virtualization is enabled in WSL so an Android emulator can
      run and display via WSLg (`/dev/kvm` present). Without it, fall back to
      Expo Go on a physical device or `expo start --web` for smoke tests.
- [ ] An Android SDK + at least one AVD available to WSL for `npm run android`.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Expo Router (file-based) | Modern Expo default; maps cleanly onto the constitution's `features/` layout | 2026-06-19 |
| v1 runs against the local Supabase stack (`supabase start`), not a hosted project | v1's bar is local testability; hosted Supabase is a Phase 7 (live) concern | 2026-06-19 |
| Auth method = email + password | Recoverable, stable account (protects her data sovereignty on device loss); no email-delivery infra needed for v1 (confirmation off) | 2026-06-19 |
| `npm run android` runs the app in an Android emulator via WSLg | The v1 local-test loop on a Windows host; iOS deferred (needs macOS/EAS) | 2026-06-19 |
| No `profiles.role` column; v1 boots the owner/Flower shell | Constitution mandates edge-based roles; the pairing edge lands in Phase 5 and activates the Mate shell in Phase 6 | 2026-06-19 |
| `lib/data/` is the sole Supabase access path | Architecture boundary | 2026-06-19 |
| `verify` = `eslint . && tsc --noEmit` | Workflow contract's per-iteration gate | 2026-06-19 |
| Session token stored via Expo SecureStore (SecureStore adapter backs the Supabase client) | Privacy-aligned (constitution); secrets do not sit in plain AsyncStorage | 2026-06-19 |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Foundation & Auth (created on merge)
- Issues: created from this spec once it is merged (one per implementable step)
- Design: `docs/design.md` (Heather · Dark) — surfaces: Auth Sign-in, Profil

## Verification

Uses the workflow contract's Verify command. Test is `none yet`, so the
behavioral items below are the script for the human milestone-QA gate.

- [ ] `npm run verify` passes.
- [ ] Fresh `npm ci && cp .env.example .env && supabase start` → `npm run
      android` launches the app in an Android emulator via WSLg (UI smoke).
- [ ] Sign-up → sign-in → kill the app → reopen → still signed in.
- [ ] Sign-out returns to the auth screen.
- [ ] The read-only profile screen shows the signed-in user's `profiles` row.
- [ ] A second user cannot read the first user's `profiles` row (RLS smoke via
      SQL / two sessions).
- [ ] The `profiles` table has no `role` column (schema check).
- [ ] No `createClient` / direct Supabase import exists outside `lib/data/`
      (grep — proves the architecture boundary).
- [ ] `.env.example` lists every variable `.env` needs — no missing keys.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| WSLg + KVM Android emulator does not start on the host | Documented setup in README; fall back to Expo Go on a physical device or `expo start --web` for smoke tests |
| Local-only assumptions leak and make the later hosted switch costly | `lib/data/` reads the Supabase URL/key from env only — swapping local for hosted is an env change, no code change |
| Auth-method churn after build starts | Decided here (email + password) before issues are created |
| Role concept leaks into a DB column out of convenience | Explicit constraint + verification check that no `role` column exists |

## Decision log

- 2026-06-19: Spec drafted; auth method initially left OPEN for the acceptance
  gate.
- 2026-06-19: Addressed spec review (PR #1) — broadened RLS to every personal-data
  table in the phase; decided session storage = Expo SecureStore; defined the
  read-only profile screen as the minimum UI; added the Supabase CLI prerequisite;
  added `lib/data/` boundary and `.env.example` verification steps.
- 2026-06-19: v1-is-local clarification — switched to the local Supabase stack
  (no hosted project / `blocked:human` for v1), added the `npm run android` WSLg
  run command, moved hosted Supabase + EAS/store to Phase 7; resolved auth method
  = email + password at the acceptance gate.
