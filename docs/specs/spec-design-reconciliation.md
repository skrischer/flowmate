# Spec: Design-fidelity reconciliation

> Created: 2026-06-25

Reconcile the 18 implemented Flowmate screens with the design contract
(`docs/design.md` + the Paper file), closing the 283 deviations found in the
design/code gap analysis — **bidirectionally**: code is corrected to the design
where the design leads, and the design is updated to the code where the
implementation is demonstrably better. This spec carries no lifecycle state —
acceptance is the spec merged on `main` with a milestone and issues.

Evidence base (full per-screen findings, `file:line`, Soll/Ist):
`docs/specs/design-reconciliation-findings.md`.

## Outcome

What is true when this work is done?

- [ ] The systematic root causes are fixed once, centrally: the card-border
      token equals the design value, the type-scale tokens map to the design
      roles, German UI copy uses real Unicode umlauts (no `ae`/`ue`/`ss`), and
      a shared back-button matches the design.
- [ ] Every audited screen either matches its design artboard, or — where the
      implementation was kept as the better solution — `docs/design.md` (and,
      where practical, the Paper artboard) is updated to match the
      implementation, with the rationale recorded.
- [ ] No remaining **high**- or **medium**-severity deviation from the findings
      doc is left unaddressed (fixed in code, or consciously adopted into the
      design); **low**-severity polish is closed or explicitly deferred.
- [ ] The three open product forks (`/mate-preview`, the Zyklus-Historie entry
      point, the Mate-ended extras) are resolved per the spec-acceptance gate and
      reflected in both code and `docs/design.md`.
- [ ] `npm run verify` and `npm test` stay green; each reconciled surface
      renders correctly in the local web/emulator smoke.

## Scope

### In scope

- The 18 audited surfaces (Shared/Flower/Mate) and the shared components they use
  (`Avatar`, `BrandMark`, `PhaseChip`, `PhaseTrack`, `WeekGlance`, `MoodRow`,
  `TrustRow`, `PredictionDisclaimer`, the settings-row pattern) plus
  `lib/theme`.
- Both directions of reconciliation: code→design (the default) and design→code
  (the exception, by updating `docs/design.md`).
- Resolving the three open forks and wiring the missing navigation entry to
  `/mate-preview` if that screen is kept.

### Out of scope

- New features or screens beyond reconciling what exists.
- The open phase-track proportions/label work — already tracked as **#152**
  (`needs:planning`); this spec defers to it and does not duplicate it.
- Editing the Paper file is best-effort only: `docs/design.md` is the committed
  source of truth (per its own contract); Paper-artboard touch-ups are a
  convenience, optionally a later `/loopkit:design` pass.
- Live/release concerns (Phase 7).

## Constraints

- `docs/design.md` is the design source of truth (its own contract: "the
  committed file here is the source of truth; the Paper file is the editor").
  Its **Color tokens**, **Type scale**, **Radii & spacing**, and **Components**
  tables are authoritative for the code→design direction.
- No emojis; German UI copy, English code/comments/commits (constitution).
- TypeScript strict; no `any`/`as unknown as`/`@ts-ignore` without a `TODO(...)`
  (constitution). Functions ≤ 50 lines, files ≤ 300 lines.
- Token/typography fixes are centralized in `lib/theme` first to avoid
  per-screen drift; screen issues depend on the central fixes. The border token
  is **split** (card/field/button border `#2F2839` vs avatar/brandmark ring
  `#3A3247`), never collapsed to one value (see Prior decisions).
- **design→code is recorded at a defined place in `docs/design.md`:** a
  kept-implementation deviation is written as a note in the **Surfaces** table's
  Notes column for that surface, and — if it changes a token/scale/component
  rule — as a bullet under **Design rules**; the Decision log entry
  cross-references it. (Paper-artboard touch-up optional, not the source of
  truth.)
- Mate surfaces must keep showing **no raw health data / no day-calendar**
  (constitution) — reconciliation is visual, never a data-exposure change.

## Prior art

- `none relevant` — this is internal design/code reconciliation against the
  project's own `docs/design.md` contract; `docs/prior-art.md` (competitor
  landscape) does not bear on it.

## Human prerequisites

- `none` — all work is local (code + `docs/design.md`); no secrets, accounts, or
  external provisioning.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| **Reconciliation is bidirectional, with a default and an exception.** Default: **code→design** — when the design clearly leads, or a discrepancy is unjustifiable, the code is changed to match `docs/design.md`/Paper. Exception: **design→code** — when the implemented solution is demonstrably better, the design is updated (edit `docs/design.md`; optionally the Paper artboard) and the rationale recorded in the Decision log. | The user's directive; matches `docs/design.md` being the contract while allowing the build to inform it. | 2026-06-25 |
| Token findings are design-authoritative → code→design — **but the border token must be SPLIT, not swapped.** Today `colors.hairline = #3A3247` serves two distinct design roles: (a) card/field/button **borders**, where the design wants `#2F2839`, and (b) the **avatar/brandmark ring**, where `#3A3247` is the correct Soll. The fix repoints role (a) to `#2F2839` and keeps role (b) at `#3A3247` under a distinct token (e.g. `ring`/`avatarBorder`), repointing usages accordingly. A blanket `hairline := #2F2839` is WRONG — it would regress the avatar/brandmark borders. Type scale (design.md §Type scale), chip/badge surfaces, and radii follow the same code→design rule per role. | design.md + Paper agree per role; the single-token collision is a code-structuring defect, not an open question. | 2026-06-25 |
| ASCII-umlaut substitutions in visible German copy are defects → fix to real Unicode. | Constitution: German UI; the substitutions are unambiguous errors. | 2026-06-25 |
| Issues are grouped by fix-area (central tokens first, then per-surface), not one-per-finding; each issue cites the findings doc. | 283 findings; one-per-finding is unworkable, central fixes close many at once. | 2026-06-25 |
| DECIDED — `/mate-preview` **keeps the #156 split** (stays a separate "Was mein Mate sieht" screen). Add the missing nav entry from Pairing-Management to it; create a Paper artboard + a `docs/design.md` Surfaces entry for it (design→code); unify the header copy to "Was mein Mate sieht". | Honors the recent #156 decision; the design follows the kept implementation. | 2026-06-25 |
| DECIDED — the Zyklus-Historie entry **moves to the Kalender** (a "Verlauf" header link/toggle on the Kalender tab); the Flower · Profil row added in #150 is **removed** so Profil matches the designed 4 rows. **No new tab** — keeps the 3-tab nav and the data-minimal vision; the Kalender is the temporally-coherent home. `docs/design.md` Kalender surface gains the entry (design→code). | Discoverable at the right mental place without nav weight or a 2nd temporal tab. | 2026-06-25 |
| DECIDED — **keep** the "Code eingeben" re-pair CTA + the sovereignty-note card on Mate · Eingestimmt (beendet); add them to the artboard + `docs/design.md` (design→code). | They give a disconnected Mate a path back — better UX than the bare artboard. | 2026-06-25 |

## Tracking

The decomposition into steps lives as GitHub issues — one per fix-area, grouped
under the milestone, each citing this spec and the findings doc.

- Milestone: Design-fidelity reconciliation (created on acceptance)
- Issues: created from this spec once merged

## Verification

The project Test command covers little UI; most checks are the human
milestone-QA gate (UI smoke against the Paper artboards). Done when:

- [ ] `npm run verify` green (eslint + tsc) and `npm test` green.
- [ ] Central tokens: card/field/button borders use `#2F2839` **and** the
      avatar/brandmark ring uses `#3A3247` (the hairline token split, not a
      blanket swap); type-scale tokens map to the design roles; the **specific
      ASCII-substituted strings enumerated in the findings doc** now render real
      umlauts (verified against that list — not a blind `ae`/`ue`/`ss` digraph
      grep, which false-positives on legitimate German words); the shared
      back-button renders on the four affected screens.
- [ ] Each audited screen, captured at 390px, matches its Paper artboard — or
      `docs/design.md` records the kept-impl deviation with rationale (Surfaces
      Notes / Design rules, per Constraints). Screens whose artboard is newly
      created under a resolved fork (e.g. `/mate-preview`, if kept) are checked
      against that new artboard. (Re-run the gap-capture pipeline as QA evidence.)
- [ ] Invite-Code shows a short formatted code with no horizontal overflow.
- [ ] The three forks are implemented as accepted, and `/mate-preview` (if kept)
      is reachable from Pairing-Management.
- [ ] No high/medium finding from the findings doc remains unaddressed.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Central token changes cause wide visual regressions across screens. | Land token issues first, re-capture all screens, eyeball before per-screen issues build on them. |
| Bidirectional ambiguity → implementer guesses direction. | The default is code→design; only the three enumerated forks are open and resolved at the gate. Any new ambiguity an implementer hits is escalated `needs:planning`, never guessed. |
| Editing the Paper file is awkward from code. | `docs/design.md` is the committed source of truth; updating it satisfies design→code. Paper touch-ups are optional/later. |
| Scope creep (treating low-severity polish as blocking). | Low-severity is a single sweep issue, explicitly deferrable. |

## Decision log

- 2026-06-25: Spec created from the design/code gap analysis (283 findings).
  Bidirectional policy adopted; token/typo/umlaut findings classified as
  design-authoritative (code→design); three product forks marked OPEN for the
  spec-acceptance gate.
- 2026-06-25 (spec review): corrected the border-token decision from a value
  swap to a **token split** — `#3A3247` is the correct ring colour for
  avatar/brandmark and must not be collapsed into the `#2F2839` card-border fix.
  Defined the design→code recording location in `docs/design.md`. Scoped the
  umlaut check to the findings doc's enumerated strings (not a blind digraph
  grep).
- 2026-06-25 (acceptance gate): three forks resolved — (1) `/mate-preview` keeps
  the #156 split (+ nav entry from Pairing-Management, + artboard/design.md);
  (2) the Zyklus-Historie entry moves to the Kalender "Verlauf" header and the
  #150 Profil row is removed (no new tab); (3) the Mate-ended re-pair CTA +
  sovereignty note are kept and added to the design. Human prerequisites: none.
