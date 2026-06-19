# Prior Art

> Descriptive, living document. Indexed BY CONCERN, not by project. Add
> entries whenever new references surface; gaps are fine.

## Challenge summary

- **Existence** — The couple-first niche is partly occupied. DuoSync is a direct
  competitor ("built for partners": phase + days-to-PMS + daily suggestions).
  Flo, Clue, Natural Cycles, Stardust all bolt a partner view onto a single-user
  app. None pairs partner-awareness with data sovereignty, and all are
  closed/paywalled. The OSS privacy trackers (drip, Euki) have data sovereignty
  but no partner concept at all. Verdict: **build, don't reuse** — but the USP
  must out-execute DuoSync, not just exist.
- **USP** — The only couple-first tracker that combines what everyone else
  splits: passive Mate attunement (push-only, zero management) AND full data
  sovereignty with the Flower (revocable, Mate never sees raw logs) — plus
  **free forever and open source**, against an all-paywalled field.
- **Differentiation / non-goals** — Mate has no edit/management rights; Mate is
  informed, not instructed (no task-feeding); not a contraception/medical
  device (prediction with disclaimer); data sovereignty as an architecture
  principle, not a setting.

## Couple / partner-awareness model

### DuoSync (closed-source, commercial)

- Path: https://duosync.io — proprietary app, no source
- License: proprietary
- Verdict: reference-only — direct competitor, validates the wedge but does not
  cover our angle
- Date: 2026-06-19
- Notes:
  - ADOPT: the partner-first core loop is validated — phase + "days until
    PMS/period" + a daily nudge to the partner. Marketing it as a couple app,
    not an add-on.
  - AVOID: task/suggestion feeding ("do this for her") — we inform, not
    instruct. Closed and commercial with no data-sovereignty story; no "she can
    revoke" model.

### Flo for Partners (closed-source, commercial)

- Path: https://flo.health — proprietary, partner companion mode
- License: proprietary
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: the invite/companion-mode flow; sharing mood changes so the partner
    stays on the same page.
  - AVOID: partner is a paywalled add-on bolted onto a single-user app; the
    partner experience feels secondary.

### Clue — shared link (closed-source, commercial)

- Path: https://helloclue.com — proprietary, read-only shared timeline
- License: proprietary
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: a simple read-only timeline as a low-effort fallback share.
  - AVOID: view-only with no understanding/attunement value for the partner.

### Stardust (closed-source, commercial)

- Path: https://stardust.app — proprietary, "partner mode"
- License: proprietary
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: "partner mode" marketed as a first-class concept.
  - AVOID: minimal partner depth; gimmicky framing ("cast a spell").

## Fertile-window & cycle prediction

### bloodyhealth/drip

- Path: https://github.com/bloodyhealth/drip — React Native; NFP rules-based
  fertile-window + bleeding prediction (`/db`, prediction modules)
- License: GPL-3.0
- Verdict: reference-only now → **reuse-candidate** if Flowmate ships
  GPL-compatible OSS (see Free / open-source positioning)
- Date: 2026-06-19
- Notes:
  - ADOPT: NFP rules-based fertile-window logic as an algorithm reference;
    data-on-device posture; GPL transparency as a trust signal. If we go
    GPL-compatible, the prediction logic can be ported/reused directly.
  - AVOID: no sync or partner model; React Native specifics if our stack
    differs; copyleft obligation if we are NOT GPL-compatible.

### Periodical (Android)

- Path: F-Droid / GitHub — Android calendar-method period prediction
- License: GPL-3.0
- Verdict: reference-only now → reuse-candidate if Flowmate is GPL-compatible OSS
- Date: 2026-06-19
- Notes:
  - ADOPT: simple, explainable calendar-method prediction as a baseline
    reference.
  - AVOID: Android-only; copyleft obligation if we are not GPL-compatible.

### Natural Cycles (closed-source, commercial)

- Path: https://naturalcycles.com — proprietary, FDA-cleared fertility/
  contraception
- License: proprietary
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: methodological credibility of the fertile-window approach.
  - AVOID: contraception positioning, medical-device regulatory burden, and the
    heavy subscription — explicitly out of scope for us.

### BBT/HR machine-learning prediction studies

- Path: rbej.biomedcentral.com (BBT+HR), pubmed 40413850 (wrist temp+HR)
- License: n/a (academic literature)
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: realistic accuracy expectations — ~85-87% fertile-window accuracy for
    regular cycles, materially worse for irregular ones. This directly justifies
    a "prediction, not a guarantee" disclaimer and conservative UX.
  - AVOID: ML/wearable dependence for v1 — calendar/symptothermal rules are
    sufficient, explainable, and run without sensors.

## Privacy / data sovereignty

### Euki-Inc/Euki-Android

- Path: https://github.com/Euki-Inc/Euki-Android — no account, no backend, all
  data on-device
- License: open source (nonprofit, 501(c)3)
- Verdict: reference-only
- Date: 2026-06-19
- Notes:
  - ADOPT: data minimization as the core trust signal (no email/identifier);
    educational/informational content model.
  - AVOID: fully local-only — incompatible with the Mate sync we require; not
    code-reusable for our partner-sync need.

## Free / open-source positioning

> Strategic concern, not a single repo. Every commercial competitor monetizes or
> paywalls (Flo, Natural Cycles, DuoSync). The OSS trackers (drip, Euki,
> Periodical) earn trust by being auditable but ignore couples. Flowmate's
> "free forever + open source" stake is the unoccupied intersection: a
> couple-first tracker that is also auditable and unpaywalled. Practical
> consequence — if Flowmate adopts a GPL-compatible license, the GPL-3.0 OSS
> prediction logic above (drip, Periodical) becomes directly reusable rather
> than reference-only.
