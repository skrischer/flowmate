# Spec: Design reconciliation — round 2 (QA follow-up)

> Created: 2026-06-25

Reconcile the follow-up deviations found while QA-ing the round-1 reconciliation
(`spec-design-reconciliation.md`, Milestone 7) against the Paper artboards —
**bidirectionally**: code is corrected to the design where the design leads, and
`docs/design.md` (plus, best-effort, the Paper artboard) is updated where the
implementation is the better solution. Also resolves the long-open phase-track
issue **#152**, now that the design values are measured. This spec carries no
lifecycle state — acceptance is the spec merged on `main` with a milestone and
issues.

Evidence base: the six annotated app-vs-design comparisons (Home, Kalender,
Periode eintragen, Mood-Logging, Zyklus-Historie, Mein Mate) and the artboard
measurements in this spec's Prior decisions.

## Outcome

What is true when this work is done?

- [ ] German long-date formatting is centralized in `features/cycle-logging/date.ts`
      (`15. Juni 2026`, with an optional weekday prefix) and the
      `DatePickerField` duplicate-date defect (`15.06.2026 · 15.06.2026`) is gone.
- [ ] Flower-Home renders the fertile window as one inline caramel row with a
      month-name range; the "Diese Woche" today marker is a full-column container
      (weekday + number + indicator); the phase-track segments use the design's
      legibility-first proportions with full, un-truncated labels (closes #152);
      the bottom tab bar has the designed top spacing.
- [ ] The Kalender marks the predicted next period as a multi-day span and the
      ovulation day as a distinct caramel-outlined cell; its header places the
      month arrows beside the title with the "Verlauf" link top-right.
- [ ] The standalone Mood-Logging screen and the Home "Stimmung" link are
      removed — mood is logged inline on Home for today only — and `docs/design.md`
      no longer lists a Mood-Logging surface.
- [ ] Zyklus-Historie KPI values drop the "T" suffix and keep the "Periode
      eintragen" CTA, with `docs/design.md` updated to match.
- [ ] "Mein Mate" is re-merged: the visibility (TransparencyCard) lives inline on
      Pairing-Management again, and the separate `/mate-preview` screen, its
      Pairing-Management nav row, and the Profil "Was mein Mate sieht" row are
      all removed — in code **and** in `docs/design.md` (the F1 reversal).
- [ ] `npm run verify` and `npm test` stay green; each touched surface renders
      correctly in the local web/emulator smoke.

## Scope

### In scope

- The surfaces in the six comparisons: Flower · Home (+ WeekGlance, MoodRow,
  PhaseTrack), Flower · Kalender (+ the pure `calendar.ts` grid model), Flower ·
  Periode eintragen (`DatePickerField`), Flower · Mood-Logging (removal), Flower ·
  Zyklus-Historie, Flower · Pairing-Management + Profil + `/mate-preview`
  (re-merge), and the bottom tab bar.
- Both directions: code→design (the default) and design→code (recorded in
  `docs/design.md`, per round-1's Constraints convention).
- Resolving **#152** with the measured artboard values (it is `needs:planning`).

### Out of scope

- New features beyond reconciling/cleaning what exists.
- The `1.1` "mobile safe-area spacing" observation — it is OS chrome (status bar /
  home indicator) handled by `SafeAreaView`/React Navigation insets, not an app
  defect; no change.
- Paper-artboard edits are best-effort: `docs/design.md` is the committed source
  of truth; artboard touch-ups (e.g. removing the Mood-Logging and Mate-preview
  artboards, adjusting the Kalender header, the fertile row, the phase track) are
  a convenience, optionally a later `/loopkit:design` pass.
- Live/release concerns (Phase 7).

## Constraints

- `docs/design.md` is the design source of truth (its own contract). Its tables
  are authoritative for code→design.
- design→code is recorded in `docs/design.md` at the defined place: a note in the
  **Surfaces** table's Notes column for that surface, and — if it changes a rule —
  a bullet under **Design rules**; the Decision log cross-references it.
- Shared files force lane discipline: `docs/design.md` (touched by Kalender,
  Mood, Historie, Mein Mate) and `app/_layout.tsx` (touched by Mood and Mein
  Mate — each removes a `Stack.Screen` plus the shared sub-screens comment) →
  those issues serialize via `Depends on:` to avoid conflicting edits.
- No emojis; German UI copy, English code/comments/commits (constitution).
- TypeScript strict; no `any`/`as unknown as`/`@ts-ignore` without `TODO(...)`;
  functions ≤ 50 lines, files ≤ 300 lines.
- Mate surfaces keep showing **no raw health data / no day-calendar** — the
  re-merge is a UI relocation of the already-derived phase-level TransparencyCard,
  never a data-exposure change.
- The prediction engine (`lib/prediction`) is not re-implemented; the calendar
  consumes `ovulationDate`/`fertileWindow`/`nextPeriodDate` it already produces.

## Prior art

- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — Clue (read-only per-day timeline) and Flo ("sharing mood changes") confirm
  competitor mood/symptom logging is **day-centric** (pick a day → log). This
  informed the Mood decision: rather than a today-only standalone screen with no
  day context, the standalone is removed and mood stays inline-for-today on Home
  (the minimal path that fits the vision's no-quantified-self non-goal); a
  day-picking backfill screen was considered and rejected as scope the vision
  does not warrant.
- [Fertile-window & cycle prediction](../prior-art.md#fertile-window--cycle-prediction)
  — drip / Periodical (calendar-method) back the calendar showing a predicted
  period **span** and an estimated **ovulation** day, with the always-on
  "prediction, not a guarantee" disclaimer.

## Human prerequisites

- `none` — all work is local (code + `docs/design.md`); no secrets, accounts, or
  external provisioning.

## Prior decisions

Measured artboard values and resolved directions the implementer must respect.

| Decision | Rationale | Date |
|---|---|---|
| Reconciliation stays **bidirectional**: default code→design; exception design→code (update `docs/design.md`, record rationale). | Continues the round-1 policy. | 2026-06-25 |
| **REVERSES round-1 F1.** "Mein Mate" is **re-merged**: the TransparencyCard returns inline to Pairing-Management (matching artboard `VX-0`); the `/mate-preview` screen (`app/mate-preview.tsx`, `features/pairing/MatePreviewScreen.tsx`), the Pairing-Management `PreviewNavRow`, the Profil "Was mein Mate sieht" row (`app/(tabs)/profile.tsx`), and the `mate-preview` `Stack.Screen` in `app/_layout.tsx` (with its stale `title: 'Was dein Mate sieht'`) are removed; the stale `_layout.tsx` comment (lines ~53–55) enumerating `mate-preview`/`mood-log` as shared sub-screens is corrected too. `docs/design.md` drops the "Flower · Mate-preview" Surfaces row, removes the Profil row mention, **and** rewrites the `Flower · Pairing-Management` Notes column so it describes the inline TransparencyCard (not a "from Flower · Profil" path). Artboard `PC-0`'s "Was mein Mate sieht" row is removed best-effort. | The design never had a separate preview artboard — the card is inline in "Mein Mate"; the round-1 split (#156/#177/#178) diverged from it. User directive (image 6). | 2026-06-25 |
| **#152 resolved from measured `A5-0` values:** phase-track segment proportions are legibility-first ≈ `7/10/5/8` (Menstruation ~24%, Follikel ~32%, Eisprung ~17%, Luteal ~27%) — **not** literal cycle-day weights `5/9/2/14` (which starved Eisprung to ~7% and truncated labels). Labels render full, left-aligned at each segment start, **no `numberOfLines`/ellipse**. | The design deliberately trades literal duration for label legibility; the active-segment fill carries the current-phase signal. | 2026-06-25 |
| **Diese Woche** today marker = full-column rounded container (artboard `BS-0`: `borderRadius 14`, `paddingBlock 9`, `gap 7`, fill `#B3A0D9`) wrapping weekday + day number + indicator dot; the dot sits inside on an on-primary tone. | code→design (1.3). | 2026-06-25 |
| **Fertile window (Home)** = one inline row `Fruchtbares Fenster · <range>` in the caramel/`secondary` tone, range as a month-name form (e.g. `22.–28. Juni`), not numeric `DD.MM.YYYY` and not a separate white line. | code→design (1.2); reuses the new date helper. | 2026-06-25 |
| **Date helper** centralizes German long dates in `date.ts` (`15. Juni 2026`; optional weekday prefix `Do · 15. Juni 2026`); `DatePickerField` shows the value once (no `relativeLabel · formatIso` duplication). The existing month-name range logic in `PeriodHistoryScreen` is the reference for the range form and may be lifted into the shared helper. | code→design (3.1) + de-duplication; one helper serves 1.2/3.1/history. | 2026-06-25 |
| **Kalender prediction** (in `features/flower/calendar.ts`): add an **`ovulation`** member to the `DayMarker` union and extend `buildMonthGrid`/`markerFor` to take `ovulationDate` (already on `Prediction`) and mark it with a caramel/`secondary` **outline** (distinct from the `fertile` fill). Mark the predicted next period as a **5-day span** — `nextPeriodDate` .. `nextPeriodDate + MENSTRUAL_DAYS − 1`, reusing the already-exported `MENSTRUAL_DAYS` (= 5) from `lib/prediction` (no engine change) — with the existing `predicted` outline (matches the artboard's 5-cell band). Marker precedence: `logged` > `predicted` > `ovulation` > `fertile`. `CalendarScreen` adds the `ovulation` cell/text style; legend stays the design's 4 items (the ovulation outline reads within "fruchtbar"). | code→design (2.2, 2.3); engine already yields `nextPeriodDate`/`ovulationDate`. | 2026-06-25 |
| **Kalender header**: month arrows flank the title on the left (`‹ Juni 2026 ›`); the "Verlauf" link moves to the top-right (matching the Home section-header link convention). | Resolved fork — user choice; mirror in `docs/design.md` + `HV-0`. | 2026-06-25 |
| **Mood-Logging**: delete `app/mood-log.tsx`, `features/flower/MoodLogScreen.tsx`, and the `mood-log` `Stack.Screen` registration in `app/_layout.tsx`; remove `MoodRow`'s `onOpenDetail` prop + the `detailLink`/"Stimmung" Pressable and drop the prop at its `FlowerHomeScreen` caller. Mood is logged inline-for-today on Home only. `docs/design.md` drops the `Flower · Mood-Logging` Surfaces row **and** updates the "Mood logging is mood-only" Design-rules bullet to state mood is logged inline on Home. `4.2` (chip wrap) is moot. | Resolved fork — user choice; prior-art-aligned, vision-minimal. | 2026-06-25 |
| **Zyklus-Historie**: drop the "T" suffix on the KPI values (units live in the labels); **keep** the "Periode eintragen" CTA and add it to `docs/design.md`/`TB-0`. | Resolved fork — user choice (5.1 code→design, 5.2 design→code). | 2026-06-25 |
| **Tab bar** gets the designed top spacing (`tabBarStyle` height/padding) so icons are not flush to the top border. | code→design (1.5). | 2026-06-25 |

## Tracking

The decomposition into steps lives as GitHub issues — one per fix-area (the
A–J map), grouped under the milestone, each citing this spec.

- Milestone: Design reconciliation — round 2 (created on acceptance)
- Issues: created from this spec once merged

## Verification

The project Test command covers little UI; most checks are the human
milestone-QA gate (UI smoke against the Paper artboards). Done when:

- [ ] `npm run verify` (eslint + tsc) and `npm test` green.
- [ ] A non-today date in `DatePickerField` shows e.g. `Do · 15. Juni 2026` once
      (no `15.06.2026 · 15.06.2026`); Home fertile row is one caramel month-name
      line.
- [ ] Home "Diese Woche" today cell visibly encloses the weekday label and the
      indicator dot; the phase track shows full `Menstruation/Follikel/Eisprung/
      Luteal` with no ellipsis (#152 acceptance).
- [ ] Kalender shows a multi-day predicted-period band and a distinct ovulation
      cell; header has arrows by the title and "Verlauf" top-right.
- [ ] `/mate-preview` route, `MatePreviewScreen`, `PreviewNavRow`, and the Profil
      "Was mein Mate sieht" row no longer exist; the TransparencyCard renders on
      Pairing-Management; `docs/design.md` has no Mate-preview/Mood-Logging
      surface rows.
- [ ] Zyklus-Historie KPIs read `28` / `5` / `6` (no "T") and the CTA is present.
- [ ] Tab bar icons have top breathing room.
- [ ] `docs/design.md` reflects every design→code change (Kalender header,
      Mood-Logging removal, Historie CTA, Mein-Mate re-merge), with Decision-log
      cross-references. (Re-run the gap-capture pipeline as QA evidence.)

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The Mein-Mate re-merge deletes screens still referenced elsewhere (routes, nav). | Grep for `/mate-preview`, `MatePreviewScreen`, `PreviewNavRow` before deleting; verify the stack/`_layout` registration is removed; smoke the Pairing flow. |
| The shared date helper changes formatting on screens beyond the targeted ones. | Helper is additive (new long-date fn); existing `formatIso` callers stay unless explicitly migrated; verify history/period rows still read correctly. |
| `docs/design.md` edit conflicts across the Kalender/Mood/Historie/Mein-Mate issues. | Serialize those issues via `Depends on:`; each makes a scoped edit to its own Surfaces row. |
| Phase-track proportions read as "wrong" vs real cycle durations. | Documented decision: legibility-first per the artboard; the active fill conveys phase, the bar is an attunement aid, not a timeline. |

## Decision log

- 2026-06-25: Spec created from the round-1 QA comparisons (six annotated
  images). Bidirectional policy retained. Forks resolved at planning via the
  user's directives: Mood standalone removed; Kalender arrows beside the title /
  Verlauf top-right; Historie CTA kept + into design.
- 2026-06-25: **Round-1 F1 reversed** — "Mein Mate" re-merged; `/mate-preview`
  split and the Profil row removed in code and `docs/design.md`.
- 2026-06-25: **#152 resolved** with measured `A5-0` artboard proportions
  (≈ `7/10/5/8`) and full, un-truncated labels.
- 2026-06-25 (spec review): made deletion artifacts explicit — Mood removal now
  names `app/mood-log.tsx`, `MoodLogScreen`, the `_layout` `Stack.Screen`, and
  the `MoodRow` prop/link; the Mein-Mate re-merge names the `_layout` comment and
  the Pairing-Management Notes-column rewrite; the Kalender change names the
  `DayMarker` `ovulation` member, the `buildMonthGrid` extension, the fixed 5-day
  span via the exported `MENSTRUAL_DAYS`, and marker precedence. Added
  `app/_layout.tsx` to the shared-file lane-discipline constraint.
