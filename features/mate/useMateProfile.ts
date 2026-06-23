// Hook: loads the Mate's own profile, partner identity, and push-token state
// (issue #111). Extracted so MateProfileScreen stays under the 50-line
// function limit (constitution: functions ≤ 50 lines).
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import {
  getOwnProfile,
  getOwnPushToken,
  getPartnerProfile,
  setPushEnabled,
} from '../../lib/data';
import type { PartnerProfile, Profile } from '../../lib/data';

export interface MateProfileState {
  profile: Profile | null;
  partner: PartnerProfile | null;
  /** null = no push-token row registered on this device yet */
  pushEnabled: boolean | null;
  pushLoading: boolean;
  isLoading: boolean;
  togglePush: (value: boolean) => Promise<void>;
}

type Setters = {
  setProfile: (p: Profile | null) => void;
  setPartner: (p: PartnerProfile | null) => void;
  setPushEnabled: (v: boolean | null) => void;
  setIsLoading: (v: boolean) => void;
};

// Fetches all profile data for a given userId and applies it via setters.
// Separated so useMateProfile stays within the 50-line function limit.
async function loadProfile(
  userId: string,
  active: { current: boolean },
  setters: Setters,
): Promise<void> {
  try {
    const [ownProfile, partnerProfile, pushToken] = await Promise.all([
      getOwnProfile(userId).then((r) => r.profile),
      getPartnerProfile(),
      getOwnPushToken(),
    ]);
    if (!active.current) return;
    setters.setProfile(ownProfile);
    setters.setPartner(partnerProfile);
    // null = no row → leave toggle disabled; boolean = registered device
    setters.setPushEnabled(pushToken !== null ? pushToken.enabled : null);
  } finally {
    if (active.current) setters.setIsLoading(false);
  }
}

export function useMateProfile(): MateProfileState {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [pushEnabled, setPushEnabledState] = useState<boolean | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const active = { current: true };
    void loadProfile(userId, active, {
      setProfile,
      setPartner,
      setPushEnabled: setPushEnabledState,
      setIsLoading,
    });
    return () => { active.current = false; };
  }, [userId]);

  async function togglePush(value: boolean): Promise<void> {
    // Optimistic update: apply the new state immediately, revert on error.
    setPushEnabledState(value);
    setPushLoading(true);
    try {
      await setPushEnabled(value);
    } catch {
      setPushEnabledState(!value);
    } finally {
      setPushLoading(false);
    }
  }

  return { profile, partner, pushEnabled, pushLoading, isLoading, togglePush };
}
