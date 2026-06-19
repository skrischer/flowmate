# Architecture

> Structural, living document — the most volatile artifact. Update whenever a
> change alters components, boundaries, or flows. This is a seed, not a final
> design.

## Component map

| Component | Responsibility |
| --------- | -------------- |
| Flowmate client (Expo, TypeScript) | One app, role-based screens (Flower vs Mate) |
| Prediction engine (`lib/prediction/`) | Pure functions: history → phases, period prediction, fertile window |
| Data layer (`lib/data/`) | The only path to Supabase; typed wrappers |
| Supabase Postgres + RLS | Schema (cycles, logs, pairings, shared views) + policies = data sovereignty |
| Supabase Auth | Accounts + invite-based Flower↔Mate pairing |
| Supabase Realtime | Flower→Mate attunement updates |
| Edge Function (push dispatcher) | On phase change → Expo Push; payload sanitized of raw data |

## Boundaries

- Components never call Supabase directly — only through `lib/data/`.
- Mate screens import no write APIs — read-only on shared views.
- The prediction engine is pure (no I/O) — unit-testable in isolation.
- RLS is the security boundary; the Edge Function boundary strips raw health data
  from push payloads.

## Key flows

1. The Flower logs a period start → `lib/data` writes → the prediction engine
   recomputes phases/predictions → Realtime notifies the Mate → the Edge Function
   sends an Expo push (phase-level info only).
2. Pairing: the Flower generates an invite → the Mate accepts → RLS grants the
   Mate read access to shared views only.
3. The Mate opens a push → the attunement view reads a shared view (no raw logs).
4. Revoke: the Flower revokes → the pairing row is deactivated → RLS cuts the
   Mate's access immediately.

## Where new code goes

- New cycle-domain logic → `features/cycle/`.
- New prediction rule → `lib/prediction/` (pure, unit-tested).
- New screen → `features/<domain>/screens/`.
- New table → migration in `supabase/migrations/` + an RLS policy is mandatory.
- New push trigger → `supabase/functions/`.
- Shared UI → `components/`; data access → `lib/data/`.
