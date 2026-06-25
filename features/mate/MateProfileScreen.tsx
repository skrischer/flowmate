// Mate · Profil (docs/design.md — Mate · Profil surface, spec-mate-push.md).
// Shows the Mate's own identity, an Eingestimmt-auf row naming the Flower they
// are attuned to, an Erscheinungsbild row, a Benachrichtigungen toggle, and an
// Abmelden affordance.
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
import { colors, fonts, spacing, typography } from '../../lib/theme';
import { useMateProfile } from './useMateProfile';

// Identity section: Avatar + own display name + attuned-to line. Rendered as a
// bare flex row (no Card wrapper) per the design — the surface lives only on the
// settings card below.
function IdentitySection({
  displayName,
  flowerName,
  email,
}: {
  displayName: string | null;
  flowerName: string | null;
  email: string | undefined;
}) {
  return (
    <View style={styles.identityRow}>
      <Avatar displayName={displayName} fallback={email} size={56} />
      <View style={styles.identityText}>
        <Text style={styles.displayName}>{displayName ?? 'Kein Name gesetzt'}</Text>
        <Text style={styles.attunedLine}>
          {flowerName !== null ? `Eingestimmt auf ${flowerName}` : 'Keine aktive Verbindung'}
        </Text>
      </View>
    </View>
  );
}

// Settings card: Eingestimmt auf + Erscheinungsbild + Benachrichtigungen toggle.
function SettingsCard({
  flowerName,
  pushEnabled,
  pushLoading,
  togglePush,
}: {
  flowerName: string | null;
  pushEnabled: boolean | null;
  pushLoading: boolean;
  togglePush: (v: boolean) => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      {/* Eingestimmt auf — partner name as the trailing value */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Icon name="person" size={20} color={colors.textMuted} />
          <Text style={styles.settingLabel}>Eingestimmt auf</Text>
        </View>
        <Text style={styles.settingValue}>{flowerName ?? 'Keine Verbindung'}</Text>
      </View>
      <View style={styles.divider} />
      {/* Erscheinungsbild — no chevron until a destination screen exists */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Icon name="appearance" size={20} color={colors.textMuted} />
          <Text style={styles.settingLabel}>Erscheinungsbild</Text>
        </View>
        <Text style={styles.settingValue}>Dunkel</Text>
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
        <IdentitySection
          displayName={profile?.display_name ?? null}
          flowerName={partner?.displayName ?? null}
          email={session?.user.email}
        />
        <SettingsCard
          flowerName={partner?.displayName ?? null}
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
    gap: 24, // content-section gap per the artboard (not 16)
  },
  // "Profil" page title: DM Sans 600 24/30 per the artboard (not H2 22).
  pageTitle: { ...typography.h2, fontSize: 24, lineHeight: 30, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: 18, // settings-card radius per the artboard (not radii.md 14)
    paddingHorizontal: spacing.field,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, gap: 3 },
  // Display name: DM Sans 600 20/26 per the artboard (not Title 16).
  displayName: { ...typography.title, fontSize: 20, lineHeight: 26, color: colors.text },
  attunedLine: { ...typography.bodySm, color: colors.textMuted },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 17, // settings-row vertical padding per the artboard (not 10)
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifTextCol: { gap: 2 },
  // Settings-row label: Inter 500 15/20 per the artboard (not Body Inter 400 16).
  settingLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 20, color: colors.text },
  // Trailing value on a settings row: muted, right-aligned, shares the label scale.
  settingValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'right',
  },
  notifCaption: { ...typography.caption, color: colors.textSubtle },
  divider: { height: 1, backgroundColor: colors.hairline },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.field,
    backgroundColor: colors.inputDisabled, // #241F2E per the artboard (not surface)
    borderColor: colors.chipBorder, // #322B3D per the artboard (not hairline)
    borderWidth: 1,
    borderRadius: 18,
  },
  signOutLabel: { ...typography.body, color: colors.danger },
});
