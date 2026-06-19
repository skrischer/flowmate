# Spec: Prediction engine

> Created: 2026-06-19

A pure, unit-tested `lib/prediction/` module that, from `periods` history,
computes the current cycle phase, the next-period date, and the fertile window —
plus the project's first machine test (`npm test`, Jest). No UI; Phase 4 renders
the results. This spec carries no lifecycle state — acceptance is the spec merged
on the default branch with a milestone and issues; progress lives in the GitHub
issues and milestone. A completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] A pure `lib/prediction/` module computes, from a `periods` history passed
      in as an argument: current cycle phase, next-period date, and fertile
      window — no I/O, deterministic, unit-tested in isolation.
- [ ] The engine's behavior on insufficient / irregular data is explicit and
      tested (resolved at the gate).
- [ ] `npm test` (Jest) runs the prediction unit tests green; the workflow
      contract's Test command is updated from `none yet` to `npm test`.
- [ ] `npm run verify` passes.

## Scope

### In scope

- `lib/prediction/` pure functions: cycle-length statistics from `periods`,
  current-phase determination, next-period prediction, and fertile-window /
  ovulation prediction.
- A typed result contract for Phase 4 to consume (the cross-phase API — Phase 4
  renders it, Phase 6 pushes on `currentPhase` changes):

  ```ts
  type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  type Confidence = 'none' | 'low' | 'medium' | 'high'
  type Prediction = {
    currentPhase: Phase
    nextPeriodDate: string                                // ISO DATE
    fertileWindow: { start: string; end: string } | null  // null when withheld
    confidence: Confidence
  }
  ```
- Jest setup + `npm test`; unit tests covering regular cycles, insufficient
  history, and irregular cycles.
- Update `docs/workflow.md`: Test command `none yet` → `npm test` (with measured
  duration).

### Out of scope

- Any UI, screens, or the "prediction, not a guarantee" disclaimer rendering
  (Phase 4 — the engine only computes; the surface renders).
- Symptom / mood / temperature inputs to prediction (v1 prediction is
  calendar-based on `periods` only).
- ML, wearable, or BBT methods (constitution: not in v1).
- Persisting predictions — they are derived on read, never stored (consistent
  with Phase 2's "a cycle is derived").

## Constraints

References `docs/constitution.md` rather than restating it.

- The engine is **pure**: no Supabase / network / clock access. It takes the
  `periods` history **and the reference "today"** as arguments — never reads the
  system clock — so it is deterministic and unit-testable (constitution:
  prediction engine is pure, unit-testable in isolation).
- The engine **sorts the input `periods` ascending by `start_date` internally**;
  callers need not pre-sort (the history UI shows descending).
- `end_date` is **not** a prediction input in v1 — cycle length is computed from
  `start_date` values only.
- Rule-based **calendar method**, client-side, explainable; no ML or sensors
  (constitution).
- Predictions are **derived, not stored** (consistent with Phase 2).
- TS `strict` + `noUncheckedIndexedAccess: true`, no `any`, functions ≤ 50 lines,
  files ≤ 300 (constitution).
- drip / Periodical (GPL-3.0) are reuse-eligible as algorithm references since
  Flowmate is GPL-3.0; v1 uses the simpler calendar method.

## Prior art

- [Fertile-window & cycle prediction](../prior-art.md#fertile-window--cycle-prediction)
  — drip / Periodical calendar-method logic as the algorithm reference, and the
  BBT/HR accuracy figures (~85% regular, much worse irregular) that drive the
  insufficient/irregular-data handling decided at the gate.

## Human prerequisites

- None.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Calendar method: cycle length = **median of the last ≤6 cycle lengths**; ovulation = next-period estimate − 14 days (luteal ~14d); fertile window = ovulation −5 .. +1 | Standard, explainable calendar/NFP rules (prior art); median resists one-off irregular outliers; sperm ~5d + ovum ~1d survival | 2026-06-19 |
| Result type pinned (`currentPhase` enum, `nextPeriodDate`, `fertileWindow` or null, `confidence` enum — see Scope) | Cross-phase API rendered in Phase 4, pushed on in Phase 6; typed here, no `any` | 2026-06-19 |
| Pure engine takes `periods` + reference "today" as args; never reads the clock | Determinism + unit-testability (constitution) | 2026-06-19 |
| Predictions derived, not stored | Consistent with Phase 2; avoids staleness | 2026-06-19 |
| Phase 3 establishes Jest + `npm test`; contract Test command updated | The pure engine is the ideal first machine test; closes `none yet` | 2026-06-19 |
| OPEN — insufficient / irregular-data policy: (a) minimum cycles before emitting a prediction, (b) below-minimum behavior (withhold → `confidence:'none'` vs default-28 assumption), (c) the "irregular" criterion (spread of recent cycle lengths), (d) how confidence levels map | resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone. This spec owns the design; the
issues own progress.

- Milestone: Prediction engine (created on merge; `Depends on milestone: #2`)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

The prediction engine is pure, so this phase introduces real machine tests —
most outcomes are covered by `npm test`, not the human QA gate.

- [ ] `npm run verify` passes.
- [ ] `npm test` passes — prediction unit tests green.
- [ ] Unit tests cover: a regular history (predicts next period + fertile
      window), insufficient history (the defined behavior), and irregular cycles
      (the defined behavior / low confidence).
- [ ] The engine is pure: no Supabase / network import in `lib/prediction/`, and
      no `new Date()` anywhere under `lib/prediction/` (recursive grep) — `today`
      is a parameter.
- [ ] `docs/workflow.md` Test command reads `npm test` with a measured duration.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Over-claiming accuracy for irregular cycles | Explicit insufficient/irregular handling (gate) + the Phase 4 disclaimer; express low confidence |
| Off-by-one date / timezone bugs | Pure functions over `DATE` values with fixed-date unit-test fixtures; `today` injected |
| Engine coupled to data/UI, breaking testability | No I/O in `lib/prediction/`; inputs passed as args; grep check in verification |

## Decision log

- 2026-06-19: Spec drafted; insufficient/irregular-data behavior left OPEN for the
  acceptance gate.
- 2026-06-19: Addressed spec review (PR #15) — pinned the result type
  (`currentPhase` enum, `fertileWindow` shape, `confidence` enum), input
  sort-order normalization, `end_date` excluded from prediction, and the
  median-of-≤6 cycle-length method; expanded the OPEN item to the full
  insufficient/irregular policy (min cycles, withhold-vs-default, irregularity
  criterion, confidence mapping).
