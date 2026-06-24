// Reactive shell state for the authenticated app. The gate (app/_layout.tsx)
// resolves the onboarding-vs-owner-vs-follower shell once a session exists and
// exposes `refresh` so a first-run transition (completing onboarding) can
// re-resolve the shell in place. Flipping the resolved shell flips the
// Stack.Protected guards, which is what moves the user between shells -- we never
// imperatively navigate into a guarded-out screen. Navigation-only; no role is
// persisted (constitution).
import { createContext, useContext } from 'react';

export interface ShellValue {
  /** Re-resolve the shell from current account state (e.g. after onboarding). */
  refresh: () => void;
}

export const ShellContext = createContext<ShellValue | undefined>(undefined);

export function useShell(): ShellValue {
  const value = useContext(ShellContext);
  if (value === undefined) {
    throw new Error('useShell must be used within the app shell gate');
  }
  return value;
}
