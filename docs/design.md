# Design contract — Flowmate

> The operational contract for the `/loopkit:design` step and the durable design
> system. Produced as a retrofit (the design phase was not enabled at inception).
> The committed file here is the source of truth; the Paper file is the editor.

## Contract (read by `/loopkit:design`)

- **Medium:** Paper MCP (`mcp__paper__*`). Editor file:
  https://app.paper.design/file/01KVFWYDRG9EP6Z2AFJM5J6ZZ3/1-0
- **Where designs live:** `docs/design.md` (this file) is the durable handoff —
  the token system + component specs + per-surface notes. The Paper file is the
  visual reference (the editor, not the source of truth).
- **Reviewer:** in-session Agent tool (`code-reviewer` / a design review pass)
  against this contract and the spec intent — never a billed CLI.
- **Handoff form:** this tokens/spec file, committed and referenced from the
  feature specs. Optional PNG exports from Paper are a convenience, not the
  source of truth.

## Theme

- **Active theme:** **Heather · Dark** — dusty lavender on warm plum/taupe.
  Mood: dried heather at twilight. (A light variant and the Tidal/Botanical
  alternatives were explored and parked; Heather Dark was chosen.)
- **Type:** display **DM Sans** (600), body **Inter** (400/500/600). px font
  sizes, em letter-spacing, px line-height.
- No emojis (constitution). UI copy is **German**; code/docs stay English.

## Color tokens (Heather · Dark)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#1A1620` | App background (plum-black) |
| `surface` | `#221D2B` | Cards, fields |
| `surface-raised` | `#2C2538` | Chips, avatars, raised controls |
| `hairline` | `#2F2839` | Borders / dividers (also `#2A2433` on nav) |
| `primary` | `#B3A0D9` | Lavender accent, CTAs, active state |
| `primary-press` | `#9F8BCB` | Pressed/active primary |
| `on-primary` | `#231C2C` | Text/icons on a lavender fill |
| `secondary` | `#D8B79C` | Caramel — fertile window, accents |
| `success` | `#9CB07E` | Sage — connected/positive |
| `danger` | `#D98C8C` | Soft rose — sign-out, errors |
| `period` | `#C68B92` | Logged period days (calendar) |
| `text` | `#ECE6F0` | Primary text |
| `text-muted` | `#9D93A6` | Secondary text |
| `text-subtle` | `#857A8E` | Captions, labels, inactive |

Light-theme and the alternative palettes (Tidal teal, Botanical moss) live in the
Paper file's theme tiles if the theme is revisited.

## Type scale

| Role | Font | Size / line | Tracking |
|---|---|---|---|
| Display | DM Sans 600 | 40 / 44 | -0.025em |
| H1 | DM Sans 600 | 30–34 / 34–36 | -0.02em |
| H2 | DM Sans 600 | 22 / 28 | -0.02em |
| Title | DM Sans 600 | 16 | -0.02em |
| Body | Inter 400 | 16 / 24 | 0 |
| Body-sm | Inter 400 | 14 / 20–21 | 0 |
| Label | Inter 600 | 13 | 0–0.01em |
| Caption | Inter 500 | 11 | 0.04–0.16em |

## Radii & spacing

- Radii: `sm 10`, `md 14–16`, `lg 24–26`, `pill 999`.
- Screen padding: 22px horizontal. Card padding: 22–24px. Section gap: 18–26px.
- Status bar: paste the Apple status-bar markup (white on this dark theme).

## Components

- **Button — primary:** `primary` fill, `on-primary` text, radius 14–15, pad
  17px; **secondary:** `surface-raised` + `hairline` border; **ghost:** text in
  `primary`; **disabled:** `#241F2E` bg, `#5A5263` text.
- **Input:** `surface` bg, `hairline` border, radius 14, pad 16; **focused:**
  1.5px `primary` border.
- **Chip:** pill; **selected** = `primary` fill + `on-primary` text; **default**
  = `#241F2E` + `#322B3D` border; **phase chip** = `surface-raised` + dot.
- **Phase track:** ONE shared component (`components/PhaseTrack.tsx`) with a
  per-surface segment **variant** — joined **bar** (Flower, default) / individual
  **pills** (Mate). 4 segments (menstrual/follicular/ovulation/luteal) with
  legibility-first proportions ≈ `7/10/5/8`, inactive `#352C42`, active `primary`
  (segment and label). Labels **alternate above/below** the bar — Menstruation +
  Eisprung **below**, Follikel + Luteal **above** — each positioned absolutely so
  it renders in full on one line without crowding, wrapping, or ellipsis; each
  label aligns to its segment.
- **Disclaimer:** 14px circled "i" (`#463C54` border) + caption — rendered on
  **every** prediction/fertility surface (constitution).
- **Bottom nav:** `#1E1926` bg, `#2A2433` top border; active item `primary`.
  **Symmetric vertical padding** — equal breathing room above the icons and
  below the labels — added on top of the device safe-area bottom inset.

## Surfaces

The full surface contract — all built in the Paper file (Heather Dark), laid out
as a journey: the **Mate** band on top, **Shared** in the middle, the **Flower**
band on the bottom. Layer names carry a `Shared ·` / `Flower ·` / `Mate ·`
prefix; listed state variants are separate artboards.

| Surface | Spec | Notes |
|---|---|---|
| Shared · Auth | `spec-foundation-auth.md` | Wordmark, email+password, trust note; "Registrieren" link |
| Shared · Onboarding | `spec-pairing.md` | First-run fork after sign-up: "Eigenen Zyklus tracken" → Flower shell; "Partner:in folgen" → Mate · Code eingeben. **Navigation-only, never a stored role.** Artboard: `docs/design-assets/shared-onboarding.png` |
| Flower · Home | `spec-flower-experience.md` | Phase card + **fertile window** (one inline caramel `Fruchtbares Fenster · <month-name range>` row) + week glance + mood row + a **context-aware period CTA** ("Periode eintragen", or **"Periode-Ende eintragen"** when the most recent period has no end — then it opens the range picker on that period's edit, anchored on its start; spec-period-range-picker). The "Diese Woche" **today cell** is a full-column lavender container enclosing weekday + number + indicator dots; the period (rose) and mood indicator dots stay **colour-distinguishable** on the lavender fill (period keeps its rose tone, mood uses a distinct on-primary tone — never both collapsed to one colour). |
| Flower · Home (keine Prognose) | `spec-flower-experience.md` | `confidence: none` variant — backfill prompt, **no fabricated window**, CTA |
| Flower · Home (niedrige Sicherheit) | `spec-flower-experience.md` | `confidence: low` variant — prediction (`~`) + a **low-confidence caveat** distinct from the disclaimer |
| Flower · Kalender | `spec-flower-experience.md` | **Header**: month-nav arrows **flank the title** on the left (`‹ Juni 2026 ›`) with the title in a **fixed-width slot** (sized to the longest month name, e.g. "September 2026") so the forward arrow keeps a **stable tap target** as months change; the **"Verlauf" link sits top-right** (Home section-header convention — title-area left, nav-link right; no touch-target collision) → Flower · Zyklus-Historie (`/periods`) — the Zyklus-Historie entry lives off the Kalender, not Profil and not a new tab (spec-design-reconciliation F2). Markers: logged **solid**; the **predicted next period as a multi-day band** (`nextPeriodDate` .. +`MENSTRUAL_DAYS`−1, outlined); the **ovulation day = fertile fill + a distinct caramel outline** (not outline-only); the rest of the fertile window as the **caramel fill**; disclaimer; **tap-a-day to log** affordance. Marker precedence: logged > predicted > ovulation > fertile. (design→code, spec-design-reconciliation-2 — mirror in artboard `HV-0`.) |
| Flower · Periode eintragen | `spec-cycle-logging.md`, `spec-period-range-picker.md` | Log/edit sheet with a **single range picker** (one month calendar) for start + optional end — **not** two separate date fields. First tap sets the start, a tap on/after it sets the end (span between filled), a tap before it re-anchors the start; **an open end ("läuft noch") is the default resting state** (no forced second tap, **past-date backfill** still works). Plus **delete** when editing. |
| Flower · Zyklus-Historie | `spec-cycle-logging.md` | Chronological period list (descending) + stats; row → edit/delete. KPI values are **bare numbers** (Ø Zyklus `28`, Ø Periode `5`, Einträge `6`) — the unit lives in the label, no "T" suffix (`—` fallback when null). A **context-aware period CTA** sits at the bottom — "Periode eintragen", or **"Periode-Ende eintragen"** when the most recent period is still open (spec-period-range-picker) — design→code (spec-design-reconciliation-2 5.2 — the `TB-0` artboard lacked it; the kept implementation leads and the design follows). |
| Flower · Invite-Code | `spec-pairing.md` | Single-use code, 24h; **"Neuen Code generieren"**; "nie deine Einträge" |
| Flower · Invite-Code (abgelaufen) | `spec-pairing.md` | Expired/used state — greyed code, "Code abgelaufen", regenerate as primary |
| Flower · Pairing-Management | `spec-pairing.md` | Reached from Flower · Profil "Mein Mate ›". Mate identity + **"Mate entfernen"/revoke** + re-invite, then the **inline "Was [Mate] sieht" TransparencyCard** (phase + heads-up + attunement hint only, never raw logs) — artboard `VX-0`; re-merged from the round-1 `/mate-preview` split (spec-design-reconciliation-2, reverses round-1 F1) |
| Flower · Profil | `spec-foundation-auth.md` | Identity + setting rows + sign out; "Mein Mate ›" row opens Flower · Pairing-Management |
| Mate · Code eingeben | `spec-pairing.md` | Mate accept screen — enter code → `accept_invite` |
| Mate · Eingestimmt | `spec-mate-push.md` | Phase + heads-up + attunement hint, **no raw data, no calendar** |
| Mate · Eingestimmt (beendet) | `spec-mate-push.md` | Revoked/empty state — header eyebrow "Zuletzt eingestimmt auf", "Verbindung beendet" headline (H2), muted **Getrennt** badge (`#241F2E`), 74px icon ring, no phase data. Plus a **"Code eingeben" re-pair CTA** and a **sovereignty-note card** ("… teilt nur, was sie möchte.") — the path back for a disconnected Mate (design→code, spec-design-reconciliation F3 — design follows the kept implementation) |
| Mate · Profil | `spec-mate-push.md` | Follower identity, Abmelden, **push on/off toggle**; Eingestimmt/Profil nav |

## Design rules (from the foundation docs)

- Every prediction/fertility surface shows the "Prognose, keine Garantie."
  disclaimer.
- Predicted days are **visually distinct from logged** (outline vs solid).
- The **Mate sees no raw data and no day-calendar** — only phase + heads-up +
  a phase-derived attunement hint ("informiert, nicht beauftragt"). This is the
  deliberate departure from prior-art partner-calendars (Clue/Natural Cycles),
  which sit in `docs/prior-art.md`'s AVOID column.
- Data-sovereignty language is foreground (invite/revoke/"was mein Mate sieht").
- **Period logging is always reachable** — a period CTA on Flower-Home
  and a tap-a-day/"+" on the Monatskalender open one shared sheet for create,
  past-date backfill, and edit; a Zyklus-Historie lists entries for edit/delete.
  The sheet uses **one range picker** for start + optional end (open end =
  "läuft noch"), and the CTA is **context-aware**: when the most recent period
  has no end it reads "Periode-Ende eintragen" and anchors the picker on that
  start, so closing out an ongoing period is one tap away (spec-period-range-picker).
- **Every prediction surface handles all confidence states** — `none` → a backfill
  CTA with no fabricated window; `low` → the prediction with a visible
  low-confidence caveat (distinct from the always-on disclaimer); `medium`/`high`
  → normal. The fertile window is surfaced on Flower-Home, not only the calendar.
- **Pairing is Flower-managed** — the Flower invites, regenerates the code, and
  revokes ("Mate entfernen"); the Mate only enters a code and toggles push. v1 has
  **no follower-initiated leave** (Flower-only sovereignty; Phase 8). The revoked
  state is designed on both sides (Pairing-Management + the empty Mate-View); the
  empty Mate-View keeps a **"Code eingeben" re-pair CTA** plus a sovereignty-note
  card so a disconnected Mate has a path back (design→code, spec-design-reconciliation
  F3 — the kept implementation, not removed to match the bare artboard).
- **The Mate path is reachable** — a first-run onboarding fork (after sign-up)
  routes "Partner:in folgen" to Mate · Code eingeben; without it the Mate role is
  designed but unreachable from the default Flower shell. The fork sets **navigation
  only — never a persisted role** (no `profiles.role`; constitution). It is skipped
  once the account has state, with a fixed precedence — **own logs → Flower shell;
  else an active follower edge → Mate shell** (both → Flower, per the Phase 6
  activation rule) — and acts as a gate, not a wizard (an abandoned "folgen" choice
  re-shows it on relaunch). The shell otherwise stays derived from the pairing edge.
- **Mood logging is mood-only** — the curated set of 6, no free-text note and no
  symptoms (data minimization + the vision's no-quantified-self non-goal). Mood is
  logged inline-for-today on the Home mood row; there is no standalone screen.
