// Mate · Code eingeben (docs/design.md, spec-pairing.md): the follower types the
// invite code the Flower shared and redeems it. accept_invite is a server-side
// SECURITY DEFINER RPC that hashes the code, validates it (exists, unexpired,
// unused) and creates the active pairing edge atomically — the follower never
// self-inserts an edge. Roles stay the direction of that edge, never a stored
// flag. All access goes through lib/data; no direct Supabase calls here.
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { acceptInvite } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';
import { BrandMark } from '../../components/BrandMark';
import { TrustRow } from '../../components/TrustRow';

export function AcceptInviteScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isPaired, setIsPaired] = useState(false);

  const submit = async () => {
    const token = code.trim();
    if (!token) {
      setError('Bitte gib einen Code ein.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await acceptInvite(token);
      setIsPaired(true);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Der Code ist ungueltig, abgelaufen oder bereits genutzt.',
      );
      setIsBusy(false);
    }
  };

  if (isPaired) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.brandRow}>
          <BrandMark />
        </View>
        <Text style={styles.successHeading}>Verbunden</Text>
        <Text style={styles.successBody}>
          Du folgst jetzt dem Zyklus deines Flowers und bleibst eingestimmt.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.ctaText}>Fertig</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <BrandMark />
        </View>

        <View style={styles.intro}>
          <Text style={styles.heading}>Code eingeben</Text>
          <Text style={styles.lede}>
            Gib den Einladungscode ein, den dein Flower mit dir geteilt hat, um
            dich zu verbinden.
          </Text>
          <TrustRow caption="Dein Flower entscheidet, was du siehst — und kann die Verbindung jederzeit beenden." />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Einladungscode</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Code"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            editable={!isBusy}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            isBusy && styles.ctaDisabled,
          ]}
          onPress={submit}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.ctaText}>Verbinden</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    padding: spacing.screen,
    gap: 24,
    justifyContent: 'center',
  },
  brandRow: { alignItems: 'center' },
  intro: { gap: 10 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '600' },
  lede: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  fieldGroup: { gap: 8 },
  label: { color: colors.label, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    color: colors.text,
    fontSize: 18,
    letterSpacing: 2,
  },
  error: { color: colors.danger, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  successScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screen,
    justifyContent: 'center',
    gap: 16,
  },
  successHeading: { color: colors.text, fontSize: 30, fontWeight: '600' },
  successBody: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
