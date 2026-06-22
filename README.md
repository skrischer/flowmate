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
  nested virtualization enabled so the emulator can run and display via WSLg
  (see [Android emulator via WSLg](#android-emulator-via-wslg)).

## Bootstrap and run locally

```sh
npm ci                     # install pinned dependencies
cp .env.example .env       # local Supabase env (Android URL preset to 10.0.2.2)
supabase start             # bring up the local Supabase stack (Docker)
npm run android            # launch the app in an Android emulator via WSLg
```

`npm run android` runs `expo run:android`: it generates the native `android/`
project on first run (via `expo prebuild` — the directory is gitignored, not
checked in), builds it, and installs it on the running emulator. The generated
project is disposable; delete `android/` and re-run to regenerate it.

## Android emulator via WSLg

The v1 local-test loop targets an Android emulator displayed on the Windows host
through WSLg. One-time host/WSL setup:

- Enable nested virtualization so the emulator gets KVM. In an elevated
  PowerShell on the host: `Set-VMProcessor -VMName WSL -ExposeVirtualizationExtensions $true`
  (WSL 2). Inside WSL, confirm `/dev/kvm` exists and is accessible
  (`ls -l /dev/kvm`); add your user to the `kvm` group if needed.
- Install the Android SDK in WSL (command-line tools, `platform-tools`, a system
  image, and `emulator`). Point `ANDROID_HOME` / `ANDROID_SDK_ROOT` at it and put
  `platform-tools` and `emulator` on `PATH`.
- Create at least one AVD (`sdkmanager` + `avdmanager create avd ...`). Start it
  with `emulator -avd <name>` — WSLg renders its window on the Windows desktop.
  Leave it running, then `npm run android` builds and installs onto it.
- The emulator reaches the host loopback (where the local Supabase stack listens)
  at `10.0.2.2`. `.env.example` already presets
  `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:56321` for this reason.

### Fallbacks (no KVM / no emulator)

- Physical device: install **Expo Go**, run `npm start`, and scan the QR code.
  Set `EXPO_PUBLIC_SUPABASE_URL` to your machine's LAN IP so the phone can reach
  the local stack (`10.0.2.2` is emulator-only).
- Browser smoke test: `npm run web` (`expo start --web`) with
  `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:56321`.

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
