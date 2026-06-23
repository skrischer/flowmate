// Hook: loads the Mate's own profile, partner identity, and push-token state
// (issue #111). Extracted so MateProfileScreen stays under the 50-line function
// limit (constitution: functions ≤ 50 lines).
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
    let active = true;

    Promise.all([
      getOwnProfile(userId).then((r) => r.profile),
      getPartnerProfile(),
      getOwnPushToken(),
    ])
      .then(([ownProfile, partnerProfile, pushToken]) => {
        if (!active) return;
        setProfile(ownProfile);
        setPartner(partnerProfile);
        // null = no row → leave toggle disabled; boolean = registered device
        setPushEnabledState(pushToken !== null ? pushToken.enabled : null);
      })
      .catch(() => {
        // Non-fatal; render what we have.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
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
