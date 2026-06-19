# Spec: Mate attunement & push

> Created: 2026-06-19

Closes the USP loop: the Mate's read-only attunement view over `shared_state`,
push-token registration, and a server-side Edge Function that sends an Expo push
when the Flower's phase changes — payloads carrying no raw health data. This spec
carries no lifecycle state — acceptance is the spec merged on the default branch
with a milestone and issues; progress lives in the GitHub issues and milestone. A
completed spec is moved to `docs/specs/archive/`.

## Outcome

- [ ] When a user is a follower on an active pairing, the app shows a **read-only
      Mate attunement view** over the owner's `shared_state` (phase + next-period
      heads-up + a phase-derived attunement hint) — no raw data, no editing.
- [ ] The Mate registers an Expo push token (owner-keyed `push_tokens`); they can
      turn push off.
- [ ] When the Flower's `current_phase` changes, a server-side Edge Function
      sends an Expo push to the paired Mate; the payload carries **no raw health
      data** — phase/attunement level only.
- [ ] After revoke, the Mate view shows no data and no further pushes are sent.
- [ ] `npm run verify` + `npm test` pass.

## Scope

### In scope

- The Mate attunement view: reads the owner's `shared_state` (Phase 5 RLS),
  renders phase + heads-up + the phase-derived attunement hint. Read-only.
- Mate-shell activation: a follower on an active pairing reaches the Mate view
  (v1 does not merge the Flower/Mate calendars — that is Phase 8).
- `push_tokens(user_id, token, platform, updated_at)` owner-keyed + own-row RLS;
  register/refresh on app start; a push on/off toggle for the Mate.
- A Supabase **Edge Function** push dispatcher, invoked by a **DB webhook on
  `shared_state` UPDATE**, that fires **only on a real `current_phase`
  transition**, looks up the active follower's token (service role), and sends an
  Expo push with a discreet, raw-data-free payload.
- `lib/data/` wrappers for the Mate view + token registration.

### Out of scope

- Multiple Mates / mixed-calendar n:m UI (Phase 8).
- Hosted push credentials (FCM/APNs prod) and store builds — Phase 7 (live); v1
  tests push via Expo Go + the Expo push service.
- Any Mate write path to owner data (read-only by construction).

## Constraints

References `docs/constitution.md` rather than restating it.

- Push payloads and server logs carry **no raw health data** — phase/attunement
  level only (constitution). The Edge Function is the sanitizing boundary.
- The Mate view reads **only** `shared_state` (Phase 5 RLS) — never `periods` /
  `daily_logs`; the Mate has no write path.
- The dispatcher fires **only on a `current_phase` transition** (compare old vs
  new), not on every `shared_state` write.
- Push runs server-side (Edge Function) so it works when the Mate's app is
  closed; it must not duplicate prediction logic (it reads `shared_state`, which
  the owner client already derived via `lib/prediction`).
- Components never call Supabase directly — only `lib/data/`; TS `strict` +
  `noUncheckedIndexedAccess`, no `any`, functions ≤ 50 lines, files ≤ 300.

## Prior art

- [Couple / partner-awareness model](../prior-art.md#couple--partner-awareness-model)
  — DuoSync's phase + heads-up partner loop (ADOPT) and the "informed, not
  instructed" stance (AVOID task-feeding).

## Human prerequisites

- [ ] An Expo account / project so the device or emulator can obtain an Expo push
      token and the Expo push service can deliver (v1 local testing via Expo Go).
      Without it, the push issues are parked `blocked:human`; the Mate view and
      token-table issues proceed.

## Prior decisions

| Decision | Rationale | Date |
|---|---|---|
| Dispatcher = DB webhook on `shared_state` UPDATE → Edge Function; fires only on a real phase transition | Server-side so push works app-closed; "on phase change" per architecture | 2026-06-19 |
| Push payload is discreet and raw-data-free (phase/attunement level only) | Constitution: no raw health data in payloads/logs; lock-screen discretion | 2026-06-19 |
| `push_tokens(user_id, token, platform, updated_at)` owner-keyed + own-row RLS | Each user manages their own token; service role reads to dispatch | 2026-06-19 |
| Mate view reachable when the user is a follower on an active pairing; no calendar merge | v1 stays 1:1 and role-framed; merge is Phase 8 | 2026-06-19 |
| OPEN — which events push: phase change only vs phase change + period/PMS heads-up | resolved at the spec-acceptance gate | — |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone.

- Milestone: Mate attunement & push (created on merge; `Depends on milestone: #5`)
- Issues: created from this spec once it is merged (one per implementable step)

## Verification

Uses the workflow contract's Verify + Test commands.

- [ ] `npm run verify` + `npm test` pass.
- [ ] As a follower on an active pairing, the Mate view shows the owner's phase +
      heads-up + attunement hint, read-only.
- [ ] The Mate view shows no `periods` / `daily_logs` data (it only reads
      `shared_state`).
- [ ] A push token registers; toggling push off stops delivery.
- [ ] A `current_phase` transition triggers exactly one push to the Mate; a
      non-phase `shared_state` write triggers none.
- [ ] The push payload contains no dates, no mood, no raw values (inspection).
- [ ] After revoke, the Mate view is empty and no push is sent.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Raw data leaks into a push payload or function log | Edge Function builds the payload from a fixed phase/hint map; review checks no raw field is referenced; verification inspects the payload |
| Push fires on every `shared_state` refresh, spamming the Mate | Dispatcher compares old vs new `current_phase`; fires only on transition |
| Expo push unavailable locally blocks the milestone | The Expo-account prerequisite is parked `blocked:human`; non-push issues proceed |
| Stale `shared_state` → wrong phase pushed | Inherited Phase 5 mitigation (owner refreshes on open/log); documented v1 limitation |

## Decision log

- 2026-06-19: Spec drafted; push-event set left OPEN for the acceptance gate.
