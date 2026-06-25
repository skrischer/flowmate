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
import { colors, fonts, radii, typography } from '../../lib/theme';
import { BrandMark } from '../../components/BrandMark';
import { Icon } from '../../components/Icon';

type Mode = 'signIn' | 'signUp';

export function SignInScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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
          <BrandMark size={72} />
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
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                editable={!isBusy}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Icon
                  name={showPassword ? 'eyeOff' : 'eye'}
                  size={20}
                  color={colors.textSubtle}
                />
              </Pressable>
            </View>
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
            <Text style={styles.footerPrompt}>{prompt}</Text>
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
  header: { alignItems: 'center', gap: 8 },
  // Wordmark: DM Sans 600 30/36 (H1 range, low end) per the Auth artboard.
  wordmark: {
    ...typography.h1,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.025 * 30,
    color: colors.text,
  },
  tagline: { ...typography.bodySm, fontSize: 15, lineHeight: 18, color: colors.textMuted },
  form: { gap: 16 },
  fieldGroup: { gap: 8 },
  label: { ...typography.label, color: colors.label },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    color: colors.text,
    fontSize: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: colors.text,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  error: { ...typography.bodySm, color: colors.danger },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  // CTA label: Inter 600 16/20 per design (not DM Sans Title).
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 20, color: colors.onPrimary },
  footer: { alignItems: 'center', gap: 20 },
  switchRow: { flexDirection: 'row', gap: 6 },
  footerPrompt: { ...typography.bodySm, color: colors.textMuted },
  // "Registrieren"/"Anmelden" toggle: Inter 600 14/18 per design.
  switchLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 18, color: colors.primary },
  trust: { ...typography.caption, color: colors.textSubtle },
});
