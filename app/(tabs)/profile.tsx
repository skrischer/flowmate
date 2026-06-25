// Flower "Profil" tab — settings-rows section per Heather Dark design (issue #104).
// Identity header uses Avatar component. Settings are grouped in a single card:
//   Mein Mate → /pairing (manage/revoke the pairing; "Verbunden" badge when paired)
//   Erscheinungsbild → placeholder row (dark-only app, no theme switch in v1)
//   Benachrichtigungen → placeholder row (push tokens exist but no settings UI in v1)
// Abmelden renders with logout icon per design.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../features/auth/AuthProvider';
import {
  getOwnProfile,
  getPartnerProfile,
  signOut,
  type PartnerProfile,
  type Profile,
} from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';

export default function ProfileTab() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let active = true;
    getOwnProfile(userId).then(({ profile: row }) => {
      if (active) setProfile(row);
    });
    getPartnerProfile()
      .then((p) => {
        if (active) setPartner(p);
      })
      .catch(() => {
        // non-fatal: partner badge omitted on network/RLS errors
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const email = session?.user.email ?? '';
  const displayName = profile?.display_name ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profil</Text>

      <View style={styles.identity}>
        <Avatar displayName={displayName} fallback={email} size={60} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{displayName ?? email}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <SettingsGroup>
        <SettingsRow
          iconName="pairing"
          label="Mein Mate"
          trailing={
            partner !== null ? (
              <Text style={styles.badgeConnected}>Verbunden</Text>
            ) : undefined
          }
          showChevron
          onPress={() => router.push('/pairing')}
          isLast={false}
        />
        <SettingsRow
          iconName="appearance"
          label="Erscheinungsbild"
          trailing={<Text style={styles.trailingMuted}>Dunkel</Text>}
          showChevron={false}
          isLast={false}
        />
        <SettingsRow
          iconName="bell"
          label="Benachrichtigungen"
          showChevron={false}
          isLast
        />
      </SettingsGroup>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={() => {
          void signOut();
        }}
      >
        <Icon name="logout" color={colors.danger} size={18} />
        <Text style={styles.signOutText}>Abmelden</Text>
      </Pressable>
    </ScrollView>
  );
}

// --- sub-components ---

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

type SettingsRowProps = {
  iconName: React.ComponentProps<typeof Icon>['name'];
  label: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isLast: boolean;
};

function SettingsRow({
  iconName,
  label,
  trailing,
  showChevron = false,
  onPress,
  isLast,
}: SettingsRowProps) {
  const inner = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Icon name={iconName} color={colors.primary} size={20} />
      <Text style={styles.rowText}>{label}</Text>
      {trailing}
      {showChevron && <Icon name="chevron" color={colors.textSubtle} size={18} />}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      style={({ pressed }) => (pressed ? styles.rowPressed : undefined)}
      onPress={onPress}
    >
      {inner}
    </Pressable>
  );
}

// --- styles ---

const GROUP_RADIUS = 18;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 24,
  },
  // "Profil" heading: DM Sans 600 24/30 per the artboard (not H1 34).
  heading: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identityText: { gap: 4 },
  name: { ...typography.h2, color: colors.text },
  email: { ...typography.bodySm, color: colors.textMuted },

  // grouped settings card
  group: {
    backgroundColor: colors.surface,
    borderColor: '#2F2839',
    borderWidth: 1,
    borderRadius: GROUP_RADIUS,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 18,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2433',
  },
  rowPressed: { opacity: 0.7 },
  rowText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  badgeConnected: {
    color: colors.successText,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },
  trailingMuted: {
    color: colors.textMuted,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },

  // sign-out button
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputDisabled,
    borderColor: colors.chipBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 9,
  },
  signOutPressed: { opacity: 0.7 },
  signOutText: {
    color: colors.danger,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
});
