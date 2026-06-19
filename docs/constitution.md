# Constitution

> Normative and binding. Every principle must be verifiable and specific.
> Keep to ~1 page; this file is permanently loaded via CLAUDE.md. No status
> marker — foundation docs carry none.

## Tech stack

| Area | Choice | Rationale |
| ---- | ------ | --------- |
| Client | React Native + Expo (TypeScript) | One codebase iOS+Android; native Expo push (the USP); TS-aligned |
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` | Type safety; `any` forbidden |
| Backend | Supabase (managed Postgres) | Free tier, open source, one platform for DB + auth + realtime + functions |
| Data sovereignty | Postgres Row-Level Security (RLS) | The Flower's control is enforced at the DB layer, not in app code |
| Auth & pairing | Supabase Auth | Integrates with RLS; invite-based Flower↔Mate pairing |
| Sync | Supabase Realtime | Flower→Mate attunement updates |
| Push | Expo Push via Supabase Edge Function | Server triggers push on phase change |
| Prediction | Rule-based (calendar / symptothermal), runs client-side | Explainable; no ML or sensors in v1; drip / Periodical (GPL) as reference |
| Testing | Jest + React Native Testing Library (target) | Standard RN test stack; see workflow contract for current state |
| License | GPL-3.0 | Copyleft trust ethos; unlocks reusing GPL prediction logic |

## Architecture principles

<Each one checkable in review>

- Every table holding Flower data has RLS enabled; the Mate role has **no SELECT
  on raw log tables** — only on shared/derived views the Flower opted into.
- The Mate client has **zero write paths** to cycle data — informed, not managing.
- Push payloads and server logs carry **no raw health data** — only
  phase/attunement-level information.
- Cycle data is accessed only through a typed data layer — no ad-hoc queries in
  components.
- Any fertility / prediction surface renders a visible "prediction, not a
  guarantee" disclaimer.
- Functions ≤ 50 lines; files ≤ 300 lines.

## Conventions

<Naming, structure, language — only what tooling does not already enforce>

- Code, comments, commits, and logs in English.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Feature-based folders (`features/<domain>/`); shared code in `lib/`.
- No emojis in code or UI.

## Quality gates

<What must pass before code merges>

- Verify green: ESLint + `tsc --noEmit`.
- No `any`, no `as unknown as`, no `@ts-ignore` / `@ts-expect-error` without a
  `TODO(...)` justification.
- Every new table touching personal data ships an RLS policy — checked in review.
- Build compiles (`expo prebuild` / EAS) before an app-affecting PR.

## Don'ts

- No raw health data in push payloads, logs, or analytics.
- No Mate write access to Flower data.
- No third-party ads or analytics SDKs (privacy + the free/OSS premise).
- No ML or wearable / BBT dependency in v1.
- No new dependency without justification — prefer native / built-in.
