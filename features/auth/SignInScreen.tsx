// Auth surface (Shared · Auth, docs/design.md): email + password, with a
// link that toggles between sign-in and sign-up. The component is thin — all
// auth logic lives in lib/data. UI copy is German; no raw credentials logged.
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

import { signIn, signUp } from '../../lib/data';
import { colors, radii } from '../../lib/theme';

type Mode = 'signIn' | 'signUp';

export function SignInScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setIsBusy(true);
    const action = mode === 'signIn' ? signIn : signUp;
    const { error: authError } = await action({ email: email.trim(), password });
    setIsBusy(false);
    if (authError) setError(authError.message);
  };

  const toggleMode = () => {
    setError(null);
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
  };

  const cta = mode === 'signIn' ? 'Anmelden' : 'Registrieren';
  const prompt = mode === 'signIn' ? 'Noch kein Konto?' : 'Schon registriert?';
  const switchLabel = mode === 'signIn' ? 'Registrieren' : 'Anmelden';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.wordmark}>Flowmate</Text>
          <Text style={styles.tagline}>Mitschwingen, statt verwalten.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="lena@beispiel.de"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isBusy}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Passwort</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
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
              <Text style={styles.ctaText}>{cta}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.switchRow}
            onPress={toggleMode}
            disabled={isBusy}
          >
            <Text style={styles.prompt}>{prompt}</Text>
            <Text style={styles.switchLabel}>{switchLabel}</Text>
          </Pressable>
          <Text style={styles.trust}>Datenhoheit bleibt bei dir.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 36,
  },
  header: { alignItems: 'center', gap: 7 },
  wordmark: {
    color: colors.text,
    fontFamily: 'System',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.75,
  },
  tagline: { color: colors.textMuted, fontSize: 15 },
  form: { gap: 16 },
  fieldGroup: { gap: 8 },
  label: { color: colors.label, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    color: colors.text,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', gap: 20 },
  switchRow: { flexDirection: 'row', gap: 6 },
  prompt: { color: colors.textMuted, fontSize: 14 },
  switchLabel: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  trust: { color: colors.textSubtle, fontSize: 12 },
});
