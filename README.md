# Flowmate

A couple-first cycle tracker: the Flower logs, the Mate stays attuned — free,
open, and under her data sovereignty. *Mitschwingen, statt verwalten.*

Built with React Native + Expo (Expo Router, TypeScript) on a Supabase backend.
v1 runs entirely locally — no hosted service required.

## Stack

- Expo SDK 56 + Expo Router (file-based routing), React Native, TypeScript
  (`strict`, `noUncheckedIndexedAccess`).
- Supabase (Postgres + Auth + RLS) on the local stack via the Supabase CLI.
- ESLint (`eslint-config-expo`, flat config).

## Prerequisites

- Node 24 and npm 11.
- Docker plus the Supabase CLI (for `supabase start`).
- For `npm run android`: an Android SDK + AVD reachable from WSL and KVM /
  nested virtualization enabled so the emulator can run and display via WSLg.
  Without it, fall back to Expo Go on a physical device or `npm run web` for a
  quick smoke test.

## Bootstrap and run locally

```sh
npm ci                     # install pinned dependencies
cp .env.example .env       # local Supabase env (filled by the supabase wiring step)
supabase start             # bring up the local Supabase stack (Docker)
npm run android            # launch the app in an Android emulator via WSLg
```

> Note: `.env.example` is a stub at this phase; the local Supabase client and the
> concrete variable set land with the data-layer wiring step. `supabase start`
> and the auth/profiles schema arrive in the same phase.

## Scripts

- `npm run verify` — `eslint . && tsc --noEmit` (the per-change quality gate).
- `npm start` — start the Expo dev server.
- `npm run android` — build and run on an Android emulator.
- `npm run web` — run in the browser (smoke).
- `npm run build` — `expo prebuild` (native projects; EAS / store builds are a
  later live-operation concern).

## Project layout

- `app/` — Expo Router screens (file-based routes).
- `features/<domain>/` — feature modules (screens + domain logic).
- `components/` — shared UI.
- `lib/data/` — the only path to Supabase (typed wrappers).
- `lib/prediction/` — pure prediction functions (no I/O).
- `supabase/migrations/` — schema + RLS migrations.

See `docs/architecture.md` for boundaries and where new code goes, and
`docs/constitution.md` for the binding principles and quality gates.

## License

GPL-3.0 — see [LICENSE](./LICENSE).
