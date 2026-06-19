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
- Mate-shell activation: a client query `pairing WHERE follower_id = auth.uid()
  AND status = 'active'` decides the view — active following → the Mate view, else
  the Flower view; a user who is both shows the Flower view in v1 (no calendar
  merge — that is Phase 8).
- `push_tokens(user_id, token, platform, updated_at)` owner-keyed + own-row RLS;
  register/refresh on app start; a push on/off toggle for the Mate.
- A Supabase **Edge Function** push dispatcher, invoked by a **DB webhook on
  `shared_state` UPDATE**. It: (1) verifies a webhook shared-secret
  (`Authorization: Bearer`, from env) and rejects otherwise; (2) fires **only on a
  real transition** — comparing the webhook body's `old_record.current_phase` vs
  `new_record.current_phase` (no re-read, no race); (3) with the service role,
  finds the **active** follower via `pairing WHERE owner_id = new_record.owner_id
  AND status = 'active'`, reads that follower's `push_tokens` row, and sends an
  Expo push with a discreet, raw-data-free payload. A revoked pairing yields no
  active follower → no push.
- `lib/data/` wrappers for the Mate view + token registration.

### Out of scope

- Multiple Mates / mixed-calendar n:m UI (Phase 8).
- Hosted push credentials (FCM/APNs prod) and store builds — Phase 7 (live); v1
  tests push via Expo Go + the Expo push service.
- Any Mate write path to owner data (read-only by construction).
- Quiet hours and push deduplication — out of scope for v1.
- Production push auth (APNs/FCM credentials, Expo access token) — Phase 7; v1
  sends to Expo-Go tokens via the Expo push service unauthenticated.

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
- The DB webhook authenticates to the Edge Function via a shared secret
  (`Authorization: Bearer`, in env); unauthenticated calls are rejected.
- Transition detection uses the webhook body's `old_record` vs `new_record` —
  never a re-read. The service-role dispatch is guarded by `pairing.status =
  'active'`; a revoked pairing produces no recipient.
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
| `push_tokens(user_id, token, platform, updated_at)`: each user owns their own row (`user_id = auth.uid()`) — the Mate owns theirs; own-row RLS; service role reads to dispatch | Avoids the "owner-keyed = Flower" misread | 2026-06-19 |
| DB webhook authenticated by a shared secret; Edge Function rejects unauthenticated calls | Without it, anyone with the function URL could trigger pushes | 2026-06-19 |
| Transition from `old_record` vs `new_record` in the webhook body; service-role dispatch guarded by `status='active'` | Race-free; revoked followers get no push | 2026-06-19 |
| Mate view reachable when the user is a follower on an active pairing; no calendar merge | v1 stays 1:1 and role-framed; merge is Phase 8 | 2026-06-19 |
| Push events = phase change AND a period/PMS heads-up, framed discreetly ("~N days", no exact date string) | Vision: phase changes + relevant heads-ups; kept discreet on the lock screen | 2026-06-19 |

## Tracking

The decomposition into steps lives as GitHub issues, not in this file — one
issue per step, grouped under the milestone.

- Milestone: Mate attunement & push (created on merge; `Depends on milestone: #5`)
- Issues: created from this spec once it is merged (one per implementable step)
- Design: `docs/design.md` (Heather · Dark) — surface: Mate-View (phase-level, no raw data, no calendar)

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
- [ ] An unauthenticated webhook call is rejected by the Edge Function.
- [ ] The constructed push payload (logged in the Edge Function's local function
      log before the Expo call) contains no dates, no mood, no raw values.
- [ ] After revoke, the Mate view is empty and no push is sent (the dispatcher's
      `status='active'` lookup yields no recipient).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Raw data leaks into a push payload or function log | Edge Function builds the payload from a fixed phase/hint map; review checks no raw field is referenced; verification inspects the payload |
| Push fires on every `shared_state` refresh, spamming the Mate | Dispatcher compares old vs new `current_phase`; fires only on transition |
| Expo push unavailable locally blocks the milestone | The Expo-account prerequisite is parked `blocked:human`; non-push issues proceed |
| Stale `shared_state` → wrong phase pushed | Inherited Phase 5 mitigation (owner refreshes on open/log); documented v1 limitation |
| In-flight push already submitted to Expo before revoke cannot be recalled | Documented v1 limit; revoke cuts DB-side access immediately |
| Production push auth not configured in v1 | Explicit v1 limit: Expo-Go tokens via the Expo push service; APNs/FCM + access token is Phase 7 |

## Decision log

- 2026-06-19: Spec drafted; push-event set left OPEN for the acceptance gate.
- 2026-06-19: Addressed security review (PR #36) — pinned webhook shared-secret
  auth, transition detection from `old_record`/`new_record`, service-role dispatch
  guarded by `status='active'`, push_tokens self-ownership, Mate-shell activation
  query, and Expo-Go-vs-prod as a v1 limit; added webhook-auth + payload-log
  verification; quiet hours/dedupe out of scope.
- 2026-06-19: Acceptance gate — push events = phase change + a discreet period/PMS
  heads-up; the Expo-account prerequisite is parked `blocked:human` on the Expo
  delivery issue; spec accepted and merged.
