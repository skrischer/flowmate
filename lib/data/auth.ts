// Typed auth access path (issue #6). Components never call supabase.auth
// directly — they go through these wrappers (architecture: lib/data/ is the
// only Supabase access path). Email + password only (spec-foundation-auth).
//
// Each call returns { error } so callers render a message without touching the
// SDK's response shape. Never log credentials or the returned session/tokens.
import type {
  AuthChangeEvent,
  AuthError,
  Session,
  Subscription,
} from '@supabase/supabase-js';

import { supabase } from './client';

export interface AuthResult {
  error: AuthError | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export const signUp = async ({
  email,
  password,
}: Credentials): Promise<AuthResult> => {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error };
};

export const signIn = async ({
  email,
  password,
}: Credentials): Promise<AuthResult> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
};

export const signOut = async (): Promise<AuthResult> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription => {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
};
