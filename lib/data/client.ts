// URL/encoding polyfills required by @supabase/supabase-js in React Native.
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { secureStoreAdapter } from './secure-store-adapter';

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

// The single Supabase access path for the whole app. The SecureStore adapter
// persists the session in the platform keystore so it survives app restarts;
// detectSessionInUrl is off because there is no browser redirect flow.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
