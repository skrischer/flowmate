// Thin wrapper around the Expo push HTTP endpoint.
//
// v1 sends to Expo-Go tokens via the public Expo push service unauthenticated
// (production APNs/FCM credentials + an Expo access token are Phase 7). The
// payload is built upstream and is already raw-data-free; this module only
// transports it. Spec: docs/specs/spec-mate-push.md.

import type { PushPayload } from './types.ts';

/** The public Expo push endpoint. */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Sends a single push to the Expo push service. Returns the HTTP status so the
 * caller can log delivery success/failure WITHOUT logging the payload contents.
 */
export async function sendExpoPush(payload: PushPayload): Promise<number> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.status;
}
