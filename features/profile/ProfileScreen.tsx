// Read-only profile screen (Flower · Profil, docs/design.md): renders the
// signed-in user's profiles row (proving the table + RLS end-to-end) plus a
// sign-out action. No edit form in Phase 1. Logic stays in lib/data.
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getOwnProfile, signOut, type Profile } from '../../lib/data';
import { colors, radii } from '../../lib/theme';
import { useAuth } from '../auth/AuthProvider';

export function ProfileScreen() {
  const { session } = useAuth();
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingTop: 24, gap: 24 },
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
