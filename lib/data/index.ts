export { supabase } from './client';
export type { Database } from './database.types';
export {
  signUp,
  signIn,
  signOut,
  getSession,
  onAuthStateChange,
} from './auth';
export type { AuthResult, Credentials } from './auth';
export { getOwnProfile, ensureProfile } from './profiles';
export type { Profile, ProfileResult } from './profiles';
