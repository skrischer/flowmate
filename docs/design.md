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
- **Phase track:** 4 weighted segments (menstrual/follicular/ovulation/luteal),
  inactive `#352C42`, active `primary`.
- **Disclaimer:** 14px circled "i" (`#463C54` border) + caption — rendered on
  **every** prediction/fertility surface (constitution).
- **Bottom nav:** `#1E1926` bg, `#2A2433` top border; active item `primary`.

## Surfaces

The full surface contract. `build` = added in the design-coherence pass, being
drawn in the Paper file; `built` = already in Paper; `+variants/+states/+empty` =
the surface exists but needs the noted state variants.

| Surface | Spec | Status | Notes |
|---|---|---|---|
| Auth Sign-in | `spec-foundation-auth.md` | built | Wordmark, email+password, trust note; "Registrieren" link |
| Profil (Flower) | `spec-foundation-auth.md` | built | Identity + setting rows + sign out; "Mein Mate" row opens Pairing-Management |
| Flower-Home | `spec-flower-experience.md` | built · +variants | Phase card + **fertile window** + week glance + mood row + "Periode eintragen" CTA; **confidence none/low variants** |
| Monatskalender | `spec-flower-experience.md` | built | Logged solid vs **predicted outlined**; fertile band; disclaimer; **tap-a-day to log** |
| Periode-Eintragen | `spec-cycle-logging.md` | build | Log/edit sheet: start-date picker (past-date backfill), optional end-date, delete |
| Zyklus-Historie | `spec-cycle-logging.md` | build | Chronological period list, descending; row → edit/delete |
| Mood-Logging | `spec-flower-experience.md` | built | 6-mood set, past-date backfill chip — **mood-only, no free-text note** |
| Invite-Code | `spec-pairing.md` | built · +states | Single-use code, 24h; **"neuen Code generieren" + expired/used states**; "nie deine Einträge" |
| Code-eingeben | `spec-pairing.md` | build | Mate accept screen — enter code → `accept_invite` |
| Pairing-Management | `spec-pairing.md` | build | Connected status + **"Mate entfernen"/revoke** + re-invite (from Profil "Mein Mate") |
| Mate-View | `spec-mate-push.md` | built · +empty | Phase + heads-up + attunement hint, **no raw data, no calendar**; **revoked/empty state** |
| Mate-Profil | `spec-mate-push.md` | build | Follower identity, Abmelden, **push on/off toggle** |

## Design rules (from the foundation docs)

- Every prediction/fertility surface shows the "Prognose, keine Garantie."
  disclaimer.
- Predicted days are **visually distinct from logged** (outline vs solid).
- The **Mate sees no raw data and no day-calendar** — only phase + heads-up +
  a phase-derived attunement hint ("informiert, nicht beauftragt"). This is the
  deliberate departure from prior-art partner-calendars (Clue/Natural Cycles),
  which sit in `docs/prior-art.md`'s AVOID column.
- Data-sovereignty language is foreground (invite/revoke/"was mein Mate sieht").
- **Period logging is always reachable** — a "Periode eintragen" CTA on Flower-Home
  and a tap-a-day/"+" on the Monatskalender open one shared sheet for create,
  past-date backfill, and edit; a Zyklus-Historie lists entries for edit/delete.
- **Every prediction surface handles all confidence states** — `none` → a backfill
  CTA with no fabricated window; `low` → the prediction with a visible
  low-confidence caveat (distinct from the always-on disclaimer); `medium`/`high`
  → normal. The fertile window is surfaced on Flower-Home, not only the calendar.
- **Pairing is Flower-managed** — the Flower invites, regenerates the code, and
  revokes ("Mate entfernen"); the Mate only enters a code and toggles push. v1 has
  **no follower-initiated leave** (Flower-only sovereignty; Phase 8). The revoked
  state is designed on both sides (Pairing-Management + the empty Mate-View).
- **Mood logging is mood-only** — the curated set of 6, no free-text note and no
  symptoms (data minimization + the vision's no-quantified-self non-goal).
