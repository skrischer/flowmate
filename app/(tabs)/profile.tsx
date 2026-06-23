// Flower "Profil" tab: identity + sign-out + interim navigation rows for
// secondary destinations (Zyklus-Historie, Mein Mate) until dedicated
// surfaces are built in later issues.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon } from '../../components/Icon';
import { useAuth } from '../../features/auth/AuthProvider';
import { getOwnProfile, signOut, type Profile } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';

export default function ProfileTab() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let active = true;
    getOwnProfile(userId).then(({ profile: row }) => {
      if (active) setProfile(row);
    });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const email = session?.user.email ?? '';
  const displayName = profile?.display_name ?? email;
  const initial = (displayName.charAt(0) || '?').toUpperCase();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profil</Text>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <View style={styles.rowGroup}>
        <NavRow
          label="Zyklus-Historie"
          iconName="clock"
          onPress={() => router.push('/periods')}
        />
        <NavRow
          label="Mein Mate"
          iconName="pairing"
          onPress={() => router.push('/pairing')}
        />
        <NavRow
          label="Mate einladen"
          iconName="share"
          onPress={() => router.push('/invite')}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={() => {
          void signOut();
        }}
      >
        <Text style={styles.signOutText}>Abmelden</Text>
      </Pressable>
    </ScrollView>
  );
}

type NavRowProps = {
  label: string;
  iconName: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
};

function NavRow({ label, iconName, onPress }: NavRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <Icon name={iconName} color={colors.textMuted} size={20} />
        <Text style={styles.rowText}>{label}</Text>
      </View>
      <Icon name="chevron" color={colors.textSubtle} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingTop: 24, paddingBottom: 32, gap: 24 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '600' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  identityText: { gap: 2 },
  name: { color: colors.text, fontSize: 22, fontWeight: '600' },
  email: { color: colors.textMuted, fontSize: 14 },
  rowGroup: { gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 18,
  },
  rowPressed: { opacity: 0.7 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  signOut: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 17,
    alignItems: 'center',
  },
  signOutPressed: { opacity: 0.7 },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
