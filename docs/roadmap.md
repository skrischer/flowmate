# Flowmate — Roadmap

> Living document: the sequenced queue of phases. The hand-off to `/plan`, which
> picks the next phase, creates its spec + issues, and links them back here.
> No status markers — progress lives in the GitHub issues and milestones each
> phase links to. Specs (created by `/plan`) carry no lifecycle state either;
> a spec is "accepted" once merged on the default branch with a milestone and
> issues.

## Phase overview

| Phase | Name | Spec | Milestone |
|---|---|---|---|
| 1 | Foundation & Auth — Expo + Supabase, accounts, roles, navigation | [spec](specs/spec-foundation-auth.md) | [#1](https://github.com/skrischer/flowmate/milestone/1) |
| 2 | Cycle logging & history — period start, schema + RLS | [spec](specs/spec-cycle-logging.md) | [#2](https://github.com/skrischer/flowmate/milestone/2) |
| 3 | Prediction engine — phases, period prediction, fertile window | [spec](specs/spec-prediction.md) | [#3](https://github.com/skrischer/flowmate/milestone/3) |
| 4 | Flower experience — phase view, predictions + disclaimer, mood/symptom logging | [spec](specs/spec-flower-experience.md) | [#4](https://github.com/skrischer/flowmate/milestone/4) |
| 5 | Pairing & data sovereignty — invite, shared views, revoke | [spec](specs/spec-pairing.md) | [#5](https://github.com/skrischer/flowmate/milestone/5) |
| 6 | Mate attunement & push — Mate view, Expo Push, Edge Function dispatcher | — | — |
| 7 | Hardening & release (live operation) — hosted Supabase + prod env, onboarding, a11y, EAS builds, store/F-Droid, GPL packaging | — | — |
| 8 | Mutual pairing & mixed calendar (n:m) — bidirectional invite, multi-pairing, unified shell (Flower/Mate navigation merges), aggregated mixed-calendar view | — | — |

A phase gets a Spec link once `/plan` drafts it, and a Milestone link once the
spec is merged. The milestone (open/closed + issue progress) is where status
lives.

v1's bar is **local testability**: Phases 1–6 run against the local Supabase
stack and an Android emulator (WSLg). Live operation — hosted Supabase, prod env,
EAS builds, store/F-Droid distribution — is consolidated in Phase 7; its issues
may be planned earlier but are never a v1 gate.

Phase 8 is a deliberate future direction, not v1 scope. It is a product/UI
project (mixed calendar, multi-pairing, bidirectional invite) — not a
re-architecture — because Phases 2 and 5 build the role substrate edge-based and
n:m-capable from the start (see `docs/constitution.md`). The data-sovereignty
reframing it implies (each person becomes both data subject and observer) is an
open product decision deferred to when Phase 8 is planned.

## North star

A couple where she logs effortlessly and he stays attuned without managing —
free, open, and under her data sovereignty.
