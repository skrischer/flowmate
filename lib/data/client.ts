// URL/encoding polyfills required by @supabase/supabase-js in React Native.
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

// EXPO_PUBLIC_* vars are inlined at build time; the anon/publishable key is
// safe to ship in the client (RLS is the security boundary, not key secrecy).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

// The single Supabase access path for the whole app. No auth storage adapter
// yet — session persistence is wired in issue #6.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
