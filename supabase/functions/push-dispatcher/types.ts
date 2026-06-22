// Shared types for the phase-change push dispatcher (Deno / Supabase Edge).
//
// This function runs under the Deno-based Supabase Edge runtime, NOT the React
// Native app toolchain. It is intentionally excluded from the app's tsconfig +
// eslint (Deno uses URL imports and Deno globals); it is type-checked by the
// Deno toolchain instead. Spec: docs/specs/spec-mate-push.md.

/** The four cycle phases; mirrors the prediction engine + shared_state CHECK. */
export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

/**
 * The owner-keyed derived row the webhook carries. Only `owner_id` and
 * `current_phase` are read here; `next_period_date` is deliberately NOT used to
 * keep raw dates out of the payload and logs (constitution).
 */
export type SharedStateRecord = {
  owner_id: string;
  current_phase: Phase | null;
};

/**
 * The Supabase database-webhook body for an UPDATE on `shared_state`. `type` and
 * `table` are present on the real payload but unused here; transition detection
 * relies solely on `old_record` vs `record` (the new row) — never a re-read.
 */
export type SharedStateWebhookBody = {
  old_record: SharedStateRecord | null;
  record: SharedStateRecord | null;
};

/** A discreet, raw-data-free push payload: phase/attunement level ONLY. */
export type PushPayload = {
  to: string;
  title: string;
  body: string;
  data: { kind: 'phase_change'; phase: Phase };
};
