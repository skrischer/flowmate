// Typed profiles access path (issue #6). The profiles table holds one own row
// per user with RLS; this is the only place that reads/writes it.
import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from './client';
import type { Database } from './database.types';

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
