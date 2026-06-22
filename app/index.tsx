import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../features/auth/AuthProvider';
import { colors, radii } from '../lib/theme';

// Owner/Flower home shell (placeholder). The full Flower home lands in Phase 3;
// Phase 1 only proves auth lands the signed-in user on the owner shell with a
// route to the read-only profile.
export default function Index() {
  const router = useRouter();
  const { session } = useAuth();
  const greeting = session?.user.email ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Guten Morgen</Text>
        <Text style={styles.title}>Flowmate</Text>
      </View>
      <Text style={styles.subtitle}>{greeting}</Text>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push('/periods')}
      >
        <Text style={styles.rowText}>Zyklus-Historie</Text>
        <Text style={styles.chevron}>{'>'}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push('/mood-log')}
      >
        <Text style={styles.rowText}>Stimmung eintragen</Text>
        <Text style={styles.chevron}>{'>'}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.rowText}>Profil</Text>
        <Text style={styles.chevron}>{'>'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 22,
    gap: 18,
  },
  header: { paddingTop: 8 },
  eyebrow: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 30, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
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
  rowText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: colors.textSubtle, fontSize: 16 },
});
