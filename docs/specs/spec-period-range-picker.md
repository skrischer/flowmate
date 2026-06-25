# Spec: Period range picker & ongoing-period CTA

> Created: 2026-06-25

Replace the two separate date fields in **Flower · Periode eintragen** with a
single **range picker** (one month calendar for start + optional end), and make
the primary period CTA on **Flower · Home** and **Flower · Zyklus-Historie**
context-aware: when the most recent period has no end date it reads
**"Periode-Ende eintragen"** and opens the picker anchored on that start. This
spec carries no lifecycle state — acceptance is the spec merged on `main` with a
milestone and issues.

## Outcome

What is true when this work is done?

- [ ] Flower · Periode eintragen uses **one** range picker (a single month
      calendar) instead of two separate date fields: start is required, end is
      optional, an open end means "läuft noch".
- [ ] The acute / ongoing case stays friction-free: a fresh log defaults to
      start = today (or the tapped calendar day from the calendar path), end
      open, with **no required picker interaction** and no forced second tap.
- [ ] When the most recent period has no `end_date`, the primary CTA on
      Flower · Home **and** Flower · Zyklus-Historie reads **"Periode-Ende
      eintragen"** and opens the picker on the edit of that period (anchored on
      its start, so only the end is added); otherwise it reads "Periode
      eintragen".
- [ ] Validation is unchanged (valid start, end ≥ start, end nullable);
      persistence still goes only through `lib/data`.
- [ ] `docs/design.md` describes the range picker and the context-aware end-CTA;
      the Paper "Periode eintragen" artboard is synced best-effort.
- [ ] `npm run verify` and `npm test` stay green.

## Scope

### In scope

- Flower · Periode eintragen: refactor `features/cycle-logging/DatePickerField.tsx`
  into a single range field (range selection over one month calendar) and switch
  `PeriodFormScreen` from two fields to one.
- Flower · Home (`FlowerHomeScreen` `LogCta`) and Flower · Zyklus-Historie
  (`PeriodHistoryScreen` CTA): context-aware label + routing based on whether a
  period is ongoing.
- A **pure, unit-tested** range-selection model (tap → next selection state) and
  an ongoing-period detection helper.
- `docs/design.md` update (the design source of truth); Paper artboard best-effort.

### Out of scope

- Per-day "painting" logging (the drip / Periodical model) — it diverges from
  Flowmate's `start_date`/`end_date` range data model; not adopted (see Prior
  decisions).
- A "läuft seit N Tagen" streak / textual ongoing indicator — the CTA label is
  the ongoing signal; minimal per the vision's no-quantified-self non-goal.
- Reminders / push to end an ongoing period — that is Mate-push / notification
  territory, not this surface.
- Special handling of multiple simultaneously-open periods beyond the existing
  validation — "the most recent period without an end" is the one ongoing period;
  older open rows are a data-entry edge, fixable via edit.
- Live / release concerns (Phase 7).

## Constraints

- No new dependency: reuse the pure `buildMonthGrid` month model from
  `features/flower/calendar.ts` and the existing hand-rolled calendar modal in
  `DatePickerField` — no native date-picker module (constitution: prefer
  native/built-in, justify every dependency).
- `DatePickerField` is used **only** in `PeriodFormScreen` (twice, verified) →
  refactor/rename it in place into the range field, no parallel component.
- Ongoing = the most recent period (by `start_date`) whose `end_date` is null.
  Both Home and Zyklus-Historie already load `listPeriods()`, so detection adds
  no new query.
- "Periode-Ende eintragen" routes to the existing period-form **edit** path of
  the ongoing period's id (`/period-form?id=…`); the range picker opens anchored
  on its start so only the end is added. No new "end-only" mode is required.
- Validation stays in `PeriodFormScreen` (valid start, end ≥ start via the
  picker's min-date, end nullable). Persistence only through `lib/data`.
- `docs/design.md` is the design source of truth; the Paper artboard is the
  editor and is synced best-effort (project convention from
  `spec-design-reconciliation-2.md`).
- TypeScript strict; no `any`/`as unknown as`/`@ts-ignore` without `TODO(...)`;
  functions ≤ 50 lines, files ≤ 300 lines. German UI copy, English
  code/comments/commits. No emojis.
- File-size heads-up: `PeriodFormScreen.tsx` is already ~326 lines (over the cap)
  and `DatePickerField.tsx` ~285. The refactor must land every touched file ≤ 300
  — extract the pure range-selection model into its own module and keep the range
  field a separate component, so the screen nets smaller, not larger.

## Prior art

- [Fertile-window & cycle prediction](../prior-art.md#fertile-window--cycle-prediction)
  — drip and Periodical (the GPL OSS calendar-method trackers) log bleeding
  **per day** on a calendar and have **no start/end form**; an ongoing period is
  implicit (the last marked days, no end). They therefore do **not** back a
  range-picker UI — but Flowmate's data model is already `start_date`/`end_date`,
  so a range picker fits **our** model. `docs/prior-art.md` documents these only
  at the prediction/privacy level; the logging-UX finding is from the projects
  themselves.
- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — the commercial references (Flo, Clue) surface an explicit ongoing-period
  state and a dedicated "end your period" action; this backs the context-aware
  "Periode-Ende eintragen" CTA over hiding end-entry inside a modal. As with
  drip/Periodical, this ongoing/end-action finding is from the products
  themselves — `docs/prior-art.md`'s entry documents the partner-awareness
  model, not the logging UX.

## Human prerequisites

- `none` — all work is local (code + `docs/design.md`); no secrets, accounts, or
  external provisioning.

## Prior decisions

Decisions already made that the implementor must respect.

| Decision | Rationale | Date |
|---|---|---|
| One **range picker** (a single month calendar for start + optional end) replaces the two date fields; reuse `buildMonthGrid`; refactor `DatePickerField` → a range field in place (single consumer). | Matches Flowmate's `start_date`/`end_date` range data model; no new dependency; one consumer means no parallel component. | 2026-06-25 |
| **Open end ("läuft noch") is the default resting state** — a fresh log starts with start = today (or the tapped calendar day) and end open; no forced second tap. The acute/ongoing case needs no picker interaction at all. | Keeps the most common (acute) logging case as friction-free as the current two-field form — parity, not regression (the user's explicit concern). | 2026-06-25 |
| **Context-aware CTA:** when the most recent period has no `end_date`, Flower · Home and Flower · Zyklus-Historie show **"Periode-Ende eintragen"**, routing to the edit form of that ongoing period with the picker anchored on its start; otherwise "Periode eintragen". | Flo/Clue pattern (explicit ongoing state + a dedicated end action); reuses the existing edit route; the label is the visible ongoing signal. | 2026-06-25 |
| **Per-day painting (drip/Periodical) is NOT adopted.** | It would break our `start_date`/`end_date` range model; the range picker fits the model and is the smaller change. | 2026-06-25 |
| The "Periode-Ende eintragen" entry **reuses the existing edit sheet as-is** — title "Periode bearbeiten", intro "Passe den Zeitraum …". The end-entry framing lives on the CTA, not in a new sheet header. | The sheet genuinely edits the period to add an end; a separate header variant is needless ceremony. | 2026-06-25 |
| OPEN — calendar behavior after the end is tapped: keep the calendar **open** with explicit "Fertig" / "Läuft noch" actions (correctable, true range-picker feel), or **auto-close** on the second tap (like the current single picker). | resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues — one issue per implementable
step, grouped under the milestone, each citing this spec. This spec owns the
design; the issues own progress.

- Milestone: Period range picker & ongoing-period CTA (created on acceptance)
- Issues: created from this spec once merged

## Verification

The project Test command covers little UI; the pure models are unit-tested and
the rest is the human milestone-QA gate (UI smoke). Done when:

- [ ] `npm run verify` (eslint + tsc) and `npm test` are green.
- [ ] Periode eintragen shows **one** range field; opening it shows a single
      month calendar where the first tap sets the start, a tap on/after the start
      sets the end (the span between is filled), a tap **before** the start
      re-anchors the start, and "Läuft noch" leaves the end open.
- [ ] A fresh log saved with no picker interaction stores start = today, end null;
      the calendar entry path still pre-fills the tapped day as the start.
- [ ] Editing a period that has an end shows both endpoints; the range can be
      adjusted and the entry deleted (delete path unchanged).
- [ ] With an ongoing period (most recent has no end), the Home and
      Zyklus-Historie CTAs read **"Periode-Ende eintragen"**; tapping opens the
      edit of that period anchored on its start; adding an end saves and the CTA
      then reverts to "Periode eintragen".
- [ ] An end before the start is not selectable (min-date) / is rejected by
      validation.
- [ ] The pure range-selection model and the ongoing-period detection helper are
      unit-tested (jest).
- [ ] `docs/design.md` describes the range picker and the context-aware end-CTA,
      with an inline `spec-period-range-picker` cross-reference (design.md's
      convention — it has no Decision-log section).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A range picker adds friction to the acute "started today, still running" case. | Open end is the default resting state; start pre-filled to today; no forced second tap (Outcome 2) — the picker need not be opened at all for that case. |
| `DatePickerField` has other consumers the refactor would break. | Verified it is imported only by `PeriodFormScreen` (twice); grep again before refactor. |
| The context-aware CTA is ambiguous when several open periods exist. | "Most recent by `start_date` without an end" is the single ongoing period; older open rows are a data-entry edge corrected via edit, not special-cased. |
| `docs/design.md` and the Paper artboard drift. | `docs/design.md` is the committed source of truth; the Paper artboard is synced best-effort (project convention). |
| The range-selection logic is fiddly (re-anchor, open end). | Extract a pure, synchronous selection model (tap + current state → next state) and unit-test it, mirroring the pure `calendar.ts` grid model. |

## Decision log

- 2026-06-25: Spec created from the design discussion. Option 2 chosen
  (range picker **+** context-aware "Periode-Ende eintragen" CTA) over a bare
  range picker or per-day painting. Prior-art finding: drip/Periodical log
  per-day with no start/end form (ongoing implicit), Flo/Clue have an explicit
  ongoing state + dedicated end action; `docs/prior-art.md` itself covers these
  only at the prediction/privacy level. The range picker fits Flowmate's
  existing `start_date`/`end_date` data model.
- 2026-06-25: Left open — calendar behavior after the end tap (keep open +
  "Fertig"/"Läuft noch" vs auto-close); resolved at the spec-acceptance gate.
- 2026-06-25 (spec review): tightened the Flo/Clue prior-art claim (ongoing/end
  action is from the products, not `docs/prior-art.md`); added a file-size
  heads-up (`PeriodFormScreen.tsx` already ~326 lines — touched files must land
  ≤ 300 via the model/component extraction); recorded that the end-entry reuses
  the existing edit sheet as-is; reworded the design.md verification item to an
  inline cross-reference (no Decision-log section in design.md).
