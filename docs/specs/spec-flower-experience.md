# Spec: Flower experience

> Created: 2026-06-19

Brings logging (Phase 2) and prediction (Phase 3) together into the Flower's
home: a phase summary with the prediction disclaimer, a month calendar, and light
daily mood/symptom logging. This spec carries no lifecycle state — acceptance is
the spec merged on the default branch with a milestone and issues; progress lives
in the GitHub issues and milestone. A completed spec is moved to
`docs/specs/archive/`.

## Outcome

- [ ] The Flower home renders the current phase, days-to-next-period, and the
      fertile window — each prediction surface shows the "prediction, not a
      guarantee" disclaimer in **all** states.
- [ ] All `confidence` states are handled: `none` → a "log / backfill more
      cycles" CTA with no fabricated window; `low` (irregular) → the prediction
      shown with a visible low-confidence caveat; `medium`/`high` → the
      prediction shown normally (disclaimer still present).
- [ ] A month calendar marks logged periods and predicted period / fertile days.
- [ ] The Flower can log a daily mood (and optional symptoms) for a date, stored
      owner-keyed with own-row RLS.
- [ ] The UI consumes `lib/prediction` (via `lib/data`) and does not reimplement
      prediction; `today` is passed into the engine.
- [ ] `npm run verify` and `npm test` pass.

## Scope

### In scope

- The Flower home screen: a phase summary card + next-period countdown + fertile
  window, with the disclaimer; the insufficient-data (`confidence: none`) state.
- A **hand-rolled** month calendar (no new calendar dependency): marks logged
  periods, the predicted next-period **start day** (`nextPeriodDate`), and the
  `fertileWindow` range. It does not predict the full bleed span in v1 (the
  engine provides no bleed length).
- Daily mood/symptom logging into a new owner-keyed table `daily_logs`: one row
  per `(owner_id, date)` (unique), `date DATE` (a mood may be logged for a past
  date, like periods), `mood` from a curated set, optional `symptoms`. Own-row
  RLS, typed CRUD in `lib/data/`, and a logging UI.
- Wiring: read `periods` (via `lib/data`) → call `lib/prediction` (with `today`)
  → render.

### Out of scope

- Pairing, the Mate view, and push (Phases 5/6). Phase 6 adds the Mate's
  shared/derived view over `daily_logs`; Phase 4 stores the raw owner-keyed log.
- The prediction algorithm itself (Phase 3).
- Per-day bleeding intensity (deferred from Phase 2).

## Constraints

References `docs/constitution.md` rather than restating it.

- Every fertility / prediction surface renders the "prediction, not a guarantee"
  disclaimer (constitution).
- The UI consumes `lib/prediction` and never reimplements it; the screen passes
  `today` into the pure engine.
- `daily_logs` is **owner-keyed** with **own-row RLS** (`owner_id = auth.uid()`);
  Phase 6 adds a separate follower SELECT policy / shared view — not a rewrite
  (consistent with Phase 2's RLS extension model).
- Components never call Supabase directly — only through `lib/data/`; TS `strict`
  + `noUncheckedIndexedAccess: true`, no `any`, functions ≤ 50 lines, files ≤ 300
  (constitution).
- Visualization default (pinned, overridable at the gate): a phase summary card +
  a month calendar.
- `today` is read in exactly **one** place at the screen boundary (a small util /
  hook) and passed down; no scattered `new Date()` across the feature.
- The disclaimer is a shared `components/` atom with a single fixed text string —
  not duplicated inline per surface.

## Prior art

- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — informs what is worth logging for the Mate's later attunement: the USP is
  *Gemüt* (mood), so mood is primary, symptoms secondary.
- [Fertile-window & cycle prediction](../prior-art.md#fertile-window--cycle-prediction)
  — surfacing predictions responsibly (confidence + disclaimer).

## Human prerequisites

- None.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| UI consumes `lib/prediction` with `today` injected; no reimplementation | Single source for prediction; keeps the engine pure/testable | 2026-06-19 |
| `daily_logs` owner-keyed + own-row RLS; Mate shared view added in Phase 6 | Edge-based substrate; no rewrite when pairing arrives | 2026-06-19 |
| `confidence: none` → withhold the prediction and show a backfill CTA; `low` → caveat; `medium`/`high` → normal | Honest; no fabricated fertile window (vision/disclaimer) | 2026-06-19 |
| Visualization = phase summary card + month calendar | Standard, legible; pinned default, confirmable at the gate | 2026-06-19 |
| `daily_logs`: one row per `(owner_id, date)` unique, `date DATE`, `mood` (curated set), optional `symptoms`; past dates allowed | Mirrors periods backfill; uniqueness avoids duplicate-per-day; stable shape for RLS + CRUD + Phase 6 share | 2026-06-19 |
| Calendar hand-rolled (no new dependency); marks logged periods, `nextPeriodDate`, `fertileWindow` | Constitution minimal-deps; avoids predicting a bleed span the engine does not provide | 2026-06-19 |
| Disclaimer = a shared `components/` atom, single fixed text; `today` read in one screen-boundary util | Consistency; one place to change; keeps clock reads out of `lib/prediction` | 2026-06-19 |
| `daily_logs` introduced in Phase 4 (not Phase 2) | Mood logging belongs to the Flower home, not cycle history | 2026-06-19 |
| Phase 4 adds unit tests for date/calendar/prediction-mapping helpers; component tests not required; must not break the Phase 3 suite | Pure helpers are unit-testable; RN screens are not the test target | 2026-06-19 |
| OPEN — mood/symptom model: the curated mood set, and whether symptoms are in v1 (and their set) | resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Flower experience (created on merge; `Depends on milestone: #2, #3`)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

Uses the workflow contract's Verify + Test commands.

- [ ] `npm run verify` passes; `npm test` passes.
- [ ] `medium`/`high`: the home shows phase + next-period + fertile window with
      the disclaimer.
- [ ] `low` (irregular): the prediction shows with a visible low-confidence
      caveat + disclaimer.
- [ ] `none` (<3 periods): the home shows the backfill CTA, no fabricated window.
- [ ] The calendar marks logged periods, `nextPeriodDate`, and the fertile window.
- [ ] Log a mood for today and for a past date → both persist; a second mood for
      the same date updates (uniqueness), not duplicates.
- [ ] A second user can neither read nor INSERT another user's `daily_logs`
      (RLS smoke — SELECT and write path).
- [ ] No `daily_logs` `role` column; `owner_id` + RLS present (schema check).
- [ ] No `createClient` / direct Supabase import outside `lib/data/` (grep).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Prediction surfaced without a disclaimer | Disclaimer is a constitution rule; checked on every prediction surface in review |
| Mood/symptom scope creep into a heavy tracker | "Light" set decided at the gate; the vision's non-goal (no quantified-self) bounds it |
| UI reimplements prediction logic | Constraint + review: the screen only calls `lib/prediction` |

## Decision log

- 2026-06-19: Spec drafted; mood/symptom model left OPEN for the acceptance gate.
- 2026-06-19: Addressed spec review (PR #21) — handled all confidence states
  (none/low/medium/high); pinned `daily_logs` schema (one row per owner+date,
  unique, past dates), hand-rolled calendar + predicted-day source, shared
  disclaimer atom, single `today` source, and the Phase-4 test expectation;
  narrowed the OPEN item to the mood set + symptom inclusion only.
