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
      fertile window (when confidence allows) — each prediction surface shows the
      "prediction, not a guarantee" disclaimer.
- [ ] When `confidence` is `none` (insufficient data), the surface shows a
      "log / backfill more cycles" call-to-action instead of a fabricated
      prediction.
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
- A month calendar visualization: logged periods + predicted period / fertile
  days.
- Daily mood/symptom logging: a new owner-keyed table (`daily_logs`) with own-row
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
| `confidence: none` → withhold the prediction and show a backfill CTA | Honest; no fabricated fertile window (vision/disclaimer) | 2026-06-19 |
| Visualization = phase summary card + month calendar | Standard, legible; pinned default, confirmable at the gate | 2026-06-19 |
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
- [ ] With ≥3 logged periods, the home shows phase + next-period + fertile window
      with the disclaimer.
- [ ] With <3 periods, the home shows the backfill CTA, no fabricated window.
- [ ] The calendar marks logged periods and predicted days.
- [ ] Log a mood for a date → it persists and shows for that date.
- [ ] A second user cannot read the first user's `daily_logs` (RLS smoke).
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
