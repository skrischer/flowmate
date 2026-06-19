# Vision

> Normative. What and why only — no implementation detail. Keep to ~1 page;
> this file is permanently loaded via CLAUDE.md. No status marker — foundation
> docs carry none.

## Problem

In relationships the mental load of the cycle sits with her alone: explaining,
remembering, contextualizing. Single-user apps (Clue, Flo) structurally leave
the partner out; the couple features that exist (DuoSync, Flo for Partners) are
bolted on, view-only, or paywalled — and none pairs partner-awareness with data
sovereignty.

## Why now

Cycle tracking is mainstream, push infrastructure is trivial, and awareness of
health-data sovereignty is rising. A couple-centric, data-minimal, free
alternative has an open field.

## Target users

A two-person team of two roles: **Flower** — she logs and holds full sovereignty
over her data; **Mate** — he receives passively and stays attuned. Role-based and
gender-neutral, primarily couples. v1 is exactly one Flower paired with one Mate.

## Goal

A full-featured cycle tracker — history, phases, period and fertile-window
prediction, light mood/symptom logging — that is on par with established apps for
the Flower, plus a passive partner-awareness layer (push, phase/mood attunement)
as the differentiator. Data sovereignty stays with the Flower; the Mate is an
invited companion, never an observer.

## USP / differentiation

Flowmate joins what everyone else splits: passive Mate attunement (push-only,
zero management) AND full data sovereignty with the Flower (revocable, the Mate
never sees raw logs) — plus **free forever and open source** against an
all-paywalled field. The Mate is informed, not instructed. Evidence and the
per-reference ADOPT/AVOID harvest live in `docs/prior-art.md` — that is where the
differentiation is grounded.

## Success criteria

Measurable. Each checkable with a number or a yes/no observation.

- The Flower logs reliably across ≥3 consecutive cycles (retention / parity).
- The Mate opens or acts on ≥50% of phase-change push notifications (engagement
  / the USP).
- Feature baseline present: cycle history, phase display, period prediction,
  fertile window.
- Free forever and fully open source (yes/no).

## Scope

### In

- Flower logging: period start, cycle history, phase view, period and
  fertile-window prediction, light mood/symptom logging.
- Mate pairing by invitation (one Flower ↔ one Mate).
- Push notifications on phase changes and relevant heads-ups.
- Mate attunement view — no raw data, no editing.
- Data sovereignty: the Flower controls what the Mate sees and can revoke access.
- Free forever, open source.

### Out

- Contraception / medical-grade guarantees.
- Wearable / BBT sensor integration.
- Multiple Mates or group sharing.
- A dedicated conception / pregnancy mode.
- Community / social features.

## Non-goals

- Not a contraception or medical device — avoids regulatory burden and the harm
  of false safety.
- The Mate is not a co-manager — preserves data sovereignty and "informed, not
  instructed".
- No advertising or data monetization — free + open source is the trust
  foundation; selling health data would destroy the premise.
- Not a quantified-self logging powerhouse — depth serves attunement, not
  completeness.

## Future direction

v1 is intentionally 1:1 and role-framed. The data substrate is built n:m-capable
from the start (roles on the pairing edge, owner-keyed data — see
`docs/constitution.md`), so a later mutual-pairing phase where Flowers can also be
Mates (roadmap Phase 8) is a product/UI step, not a rebuild.

That evolution shifts the sovereignty story: once a person is both data subject
and observer, "data sovereignty stays with her" no longer frames it cleanly. For
v1 the story stands unchanged — the reframing is a deliberate, open product
decision deferred to when Phase 8 is planned, not settled here.
