// Phase-change push dispatcher (Supabase Edge Function, Deno runtime).
//
// Invoked by a DB webhook on `shared_state` UPDATE. It (1) verifies the webhook
// shared-secret and rejects otherwise; (2) fires ONLY on a real current_phase
// transition (old vs new in the body, never a re-read); (3) resolves the ACTIVE
// follower via the service role and sends a discreet, raw-data-free Expo push.
// A revoked pairing yields no active follower -> no push.
//
// NO raw health data ever enters the payload or the logs — only the new phase
// name and fixed attunement copy (constitution). The live device-delivery test
// is the separate issue #40. Spec: docs/specs/spec-mate-push.md.

import { dispatchPhaseChange, phaseTransition, serviceClient } from './dispatcher.ts';
import type { SharedStateWebhookBody } from './types.ts';

/** Reads a required env var or throws — surfaces misconfiguration loudly. */
function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/** True iff the request carries the configured webhook shared-secret. */
function isAuthorized(request: Request): boolean {
  const expected = `Bearer ${requireEnv('PUSH_WEBHOOK_SECRET')}`;
  return request.headers.get('Authorization') === expected;
}

/** A small JSON response helper. */
function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }
  if (!isAuthorized(request)) {
    // No body details logged: an unauthenticated caller gets nothing back.
    return json(401, { error: 'unauthorized' });
  }

  let body: SharedStateWebhookBody;
  try {
    body = (await request.json()) as SharedStateWebhookBody;
  } catch {
    return json(400, { error: 'invalid_body' });
  }

  const phase = phaseTransition(body);
  if (phase === null) {
    return json(200, { dispatched: false, reason: 'no_transition' });
  }

  const ownerId = body.record?.owner_id;
  if (!ownerId) {
    return json(400, { error: 'missing_owner' });
  }

  const client = serviceClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );
  const dispatched = await dispatchPhaseChange(client, ownerId, phase);
  return json(200, { dispatched });
});
