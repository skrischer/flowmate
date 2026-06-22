// First-run onboarding gate state (spec-pairing.md: the Mate entry point).
//
// The onboarding fork is navigation-only: it is NEVER persisted as a role (no
// profiles.role; the shell stays derived from the pairing edge — constitution).
// What IS persisted is a device-local completion boolean in SecureStore (the
// adapter Phase 1 chose for the session token; not AsyncStorage, not synced, no
// health data). Components never call Supabase or SecureStore directly — they go
// through this typed access path.
//
// The gate resolves the destination with a fixed precedence (spec):
//   1. own logged periods  -> Flower shell (skip the fork)
//   2. else an active follower edge -> Mate shell (skip the fork)
//   3. else the completion flag is set -> the account already chose -> shell
//   4. else -> show the fork
// A user who is both owner and follower lands on the Flower shell (case 1 wins),
// matching the Phase 6 activation rule.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { supabase } from './client';

const ONBOARDING_COMPLETE_KEY = 'flowmate.onboarding.complete';
const FLAG_VALUE = '1';

// SecureStore is unavailable on web (the `expo start --web` smoke path only);
// localStorage backs the flag there, mirroring the session storage adapter.
const readFlag = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return globalThis.localStorage.getItem(ONBOARDING_COMPLETE_KEY);
  }
  return SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
};

const writeFlag = async (value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    globalThis.localStorage.setItem(ONBOARDING_COMPLETE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, value);
};

/** Whether the device-local onboarding completion flag is set. */
export async function getOnboardingComplete(): Promise<boolean> {
  return (await readFlag()) === FLAG_VALUE;
}

/**
 * Marks onboarding complete on this device (the account chose "Eigenen Zyklus
 * tracken"). Device-local and never synced; carries no role and no health data.
 */
export async function setOnboardingComplete(): Promise<void> {
  await writeFlag(FLAG_VALUE);
}

/** Whether the current account has at least one logged period of its own. */
async function hasOwnLogs(): Promise<boolean> {
  const { count, error } = await supabase
    .from('periods')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw error;
  }
  return (count ?? 0) > 0;
}

/** Whether the current account is the follower on an active pairing edge. */
async function hasActiveFollowerEdge(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    return false;
  }
  const { count, error: pairingError } = await supabase
    .from('pairing')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', data.user.id)
    .eq('status', 'active');
  if (pairingError) {
    throw pairingError;
  }
  return (count ?? 0) > 0;
}

/**
 * Resolves whether the first-run fork should be shown, applying the spec
 * precedence: own logs or an active follower edge or the stored flag all skip
 * the fork; only a stateless, unflagged account sees it.
 */
export async function resolveOnboardingNeeded(): Promise<boolean> {
  if (await hasOwnLogs()) {
    return false;
  }
  if (await hasActiveFollowerEdge()) {
    return false;
  }
  return !(await getOnboardingComplete());
}
