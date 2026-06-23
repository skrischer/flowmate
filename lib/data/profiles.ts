// Typed profiles access path (issue #6). The profiles table holds one own row
// per user with RLS; this is the only place that reads/writes it.
import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from './client';
import type { Database } from './database.types';

/**
 * The minimal partner identity surface returned by getPartnerProfile (issue #112).
 * Only id + displayName -- no health data lives on profiles.
 */
export interface PartnerProfile {
  id: string;
  displayName: string | null;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface ProfileResult {
  profile: Profile | null;
  error: PostgrestError | null;
}

export const getOwnProfile = async (userId: string): Promise<ProfileResult> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return { profile: data, error };
};

// Creates the user's own profile row if it does not exist yet. Called after
// sign-up/sign-in so the read-only profile screen always has a row to render.
export const ensureProfile = async (
  userId: string,
): Promise<PostgrestError | null> => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  return error;
};

/**
 * Returns the ACTIVE paired partner's id and display_name for the current user
 * (issue #112). Works in BOTH roles:
 *   * as owner  -- resolves the follower_id from the active edge
 *   * as follower -- resolves the owner_id from the active edge
 *
 * The `profiles_select_active_partner` RLS policy (migration
 * 20260623000000_profiles_select_partner.sql) enforces that the profiles row is
 * only reachable while the edge is ACTIVE; revoke cuts access immediately.
 *
 * Returns null when there is no session, no active pairing, or the partner has
 * not set a display name yet (the field is nullable). Never reads raw health data.
 */
export async function getPartnerProfile(): Promise<PartnerProfile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!userData.user) {
    return null;
  }
  const userId = userData.user.id;

  // Resolve the active edge in either direction to find the partner's id.
  const { data: edge, error: edgeError } = await supabase
    .from('pairing')
    .select('owner_id, follower_id')
    .eq('status', 'active')
    .or(`owner_id.eq.${userId},follower_id.eq.${userId}`)
    .maybeSingle();
  if (edgeError) {
    throw edgeError;
  }
  if (!edge) {
    return null;
  }

  const partnerId = edge.owner_id === userId ? edge.follower_id : edge.owner_id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', partnerId)
    .maybeSingle();
  if (profileError) {
    throw profileError;
  }
  if (!profile) {
    return null;
  }

  return { id: profile.id, displayName: profile.display_name };
}
