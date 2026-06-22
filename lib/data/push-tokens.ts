// Typed access for the self-owned `push_tokens` table.
//
// This module is the ONLY access path to push_tokens -- components never call
// Supabase directly (constitution). Every row is self-owned: the user is always
// the authenticated user, never a caller-supplied id, and RLS (user_id =
// auth.uid()) is the enforcing boundary. There is one row per user (user_id is
// the primary key), so register/refresh is an UPSERT on user_id -- a refreshed
// device token replaces the old one rather than accumulating stale rows. This
// table carries NO raw health data; it holds only the Expo token + an on/off
// toggle the Mate controls.

import { supabase } from './client';
import type { Tables } from './database.types';

/** The supported native platforms; mirrors the DB CHECK constraint. */
export const PUSH_PLATFORMS = ['ios', 'android'] as const;

export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/** A registered push-token row as stored, including the derived id and toggle. */
export type PushToken = Tables<'push_tokens'>;

/**
 * Fields a caller provides to register or refresh a device token. `user_id`,
 * `id`, `updated_at`, and `enabled` are intentionally omitted: ownership is
 * resolved from the authenticated session, and the toggle defaults on at the DB
 * and is changed via `setPushEnabled`. `platform` is the narrowed union.
 */
export type NewPushToken = {
  expo_push_token: string;
  platform: PushPlatform;
};

/** Resolves the authenticated user's id, throwing when no session exists. */
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('No authenticated user: cannot resolve the push-token owner.');
  }
  return data.user.id;
}

/**
 * Registers (or refreshes) the current user's device push token. Called on app
 * start: upserts on the user_id primary key so a changed Expo token replaces the
 * previous one and `updated_at` is bumped. Re-enables a previously disabled row,
 * matching "register on start". Returns the stored row.
 */
export async function registerPushToken(token: NewPushToken): Promise<PushToken> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token.expo_push_token,
        platform: token.platform,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Reads the current user's push-token row, or `null` when none is registered.
 * RLS restricts the lookup to the caller's own row.
 */
export async function getOwnPushToken(): Promise<PushToken | null> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select()
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Toggles push delivery for the current user. Setting `enabled` to false stops
 * delivery (the dispatcher skips disabled rows); true resumes it. RLS guarantees
 * a caller can only change its own row. Returns the updated row.
 */
export async function setPushEnabled(enabled: boolean): Promise<PushToken> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('push_tokens')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
