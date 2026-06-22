// Session state for the whole app (issue #6). Loads the persisted session on
// mount and subscribes to auth changes, so the navigation gate can route
// authenticated users to the home shell and everyone else to the auth screen.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { ensureProfile, getSession, onAuthStateChange } from '../../lib/data';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getSession()
      .then((initial) => {
        if (!active) return;
        setSession(initial);
        setIsLoading(false);
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    const subscription = onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void ensureProfile(next.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
