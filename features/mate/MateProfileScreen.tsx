// Mate · Profil (docs/design.md — Mate · Profil surface, spec-mate-push.md).
// Shows the Mate's own identity, the Flower they are attuned to, an
// Erscheinungsbild row, a Benachrichtigungen toggle, and an Abmelden affordance.
//
// Benachrichtigungen toggle is disabled when no push-token row is registered
// (getOwnPushToken returns null). Prevents a silent no-op UPDATE on the row.
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
import { signOut } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { useMateProfile } from './useMateProfile';

// Identity card: Avatar + own display name + attuned-to line.
function IdentityCard({
  displayName,
  flowerName,
  email,
}: {
  displayName: string | null;
  flowerName: string | null;
  email: string | undefined;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.identityRow}>
        <Avatar displayName={displayName} fallback={email} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.displayName}>{displayName ?? 'Kein Name gesetzt'}</Text>
          <Text style={styles.attunedLine}>
            {flowerName !== null ? `Eingestimmt auf ${flowerName}` : 'Keine aktive Verbindung'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Settings card: Erscheinungsbild + Benachrichtigungen toggle.
function SettingsCard({
  pushEnabled,
  pushLoading,
  togglePush,
}: {
  pushEnabled: boolean | null;
  pushLoading: boolean;
  togglePush: (v: boolean) => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      {/* Erscheinungsbild — no chevron until a destination screen exists */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Icon name="appearance" size={20} color={colors.textMuted} />
          <Text style={styles.settingLabel}>Erscheinungsbild</Text>
        </View>
      </View>
      <View style={styles.divider} />
      {/* Benachrichtigungen — disabled when pushEnabled is null (no registered row) */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Icon name="bell" size={20} color={colors.textMuted} />
          <View style={styles.notifTextCol}>
            <Text style={styles.settingLabel}>Benachrichtigungen</Text>
            {pushEnabled === null ? (
              <Text style={styles.notifCaption}>Kein Gerät registriert</Text>
            ) : null}
          </View>
        </View>
        <Switch
          value={pushEnabled ?? false}
          onValueChange={togglePush}
          disabled={pushLoading || pushEnabled === null}
          trackColor={{ false: colors.hairline, true: colors.primary }}
          thumbColor={colors.onPrimary}
        />
      </View>
    </View>
  );
}

export function MateProfileScreen() {
  const { session } = useAuth();
  const { profile, partner, pushEnabled, pushLoading, isLoading, togglePush } =
    useMateProfile();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  function handleSignOut() {
    Alert.alert('Abmelden', 'Wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Profil</Text>
        <IdentityCard
          displayName={profile?.display_name ?? null}
          flowerName={partner?.displayName ?? null}
          email={session?.user.email}
        />
        <SettingsCard
          pushEnabled={pushEnabled}
          pushLoading={pushLoading}
          togglePush={togglePush}
        />
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
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, gap: 3 },
  displayName: { ...typography.title, color: colors.text },
  attunedLine: { ...typography.bodySm, color: colors.textMuted },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifTextCol: { gap: 2 },
  settingLabel: { ...typography.body, color: colors.text },
  notifCaption: { ...typography.caption, color: colors.textSubtle },
  divider: { height: 1, backgroundColor: colors.hairline },
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
