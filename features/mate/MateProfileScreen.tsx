// Mate · Profil (docs/design.md — Mate · Profil surface, spec-mate-push.md).
// Shows the Mate's own identity, the Flower they are attuned to, an
// Erscheinungsbild row, a Benachrichtigungen toggle (wired to the existing
// push-tokens layer), and an Abmelden affordance.
//
// Data accessed:
//   getOwnProfile(userId)  — Mate's own display_name (no raw health data)
//   getPartnerProfile()    — Flower's display_name only (PartnerProfile: id + displayName)
//   getOwnPushToken()      — reads enabled state
//   setPushEnabled(bool)   — toggles push delivery
//   signOut()              — ends the session
//
// The Mate sees no raw cycle data here — identity + settings only.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import {
  getOwnProfile,
  getPartnerProfile,
  getOwnPushToken,
  setPushEnabled,
  signOut,
} from '../../lib/data';
import type { PartnerProfile, Profile } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';

export function MateProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [pushEnabled, setPushEnabledState] = useState<boolean>(true);
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
        if (pushToken !== null) {
          setPushEnabledState(pushToken.enabled);
        }
      })
      .catch(() => {
        // Non-fatal — render what we have.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleTogglePush(value: boolean) {
    setPushLoading(true);
    try {
      await setPushEnabled(value);
      setPushEnabledState(value);
    } catch {
      // Revert optimistic update on error.
      setPushEnabledState(!value);
    } finally {
      setPushLoading(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Abmelden', 'Wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.display_name ?? null;
  const flowerName = partner?.displayName ?? null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Identity card */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <Avatar displayName={displayName} fallback={session?.user.email} size={56} />
            <View style={styles.identityText}>
              <Text style={styles.displayName}>
                {displayName ?? 'Kein Name gesetzt'}
              </Text>
              {flowerName !== null ? (
                <Text style={styles.attunedLine}>Eingestimmt auf {flowerName}</Text>
              ) : (
                <Text style={styles.attunedLine}>Keine aktive Verbindung</Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings rows */}
        <View style={styles.card}>
          {/* Erscheinungsbild */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="appearance" size={20} color={colors.textMuted} />
              <Text style={styles.settingLabel}>Erscheinungsbild</Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textSubtle} />
          </View>

          <View style={styles.divider} />

          {/* Benachrichtigungen */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="bell" size={20} color={colors.textMuted} />
              <Text style={styles.settingLabel}>Benachrichtigungen</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              disabled={pushLoading}
              trackColor={{ false: colors.hairline, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
          <Icon name="logout" size={20} color={colors.danger} />
          <Text style={styles.signOutLabel}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 16,
  },
  pageTitle: { ...typography.h2, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.field,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identityText: { flex: 1, gap: 3 },
  displayName: { ...typography.title, color: colors.text },
  attunedLine: { ...typography.bodySm, color: colors.textMuted },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: { ...typography.body, color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 0,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.field,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  signOutLabel: { ...typography.body, color: colors.danger },
});
