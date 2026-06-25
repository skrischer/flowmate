// Shared · Onboarding (docs/design.md, spec-pairing.md): the first-run fork after
// sign-up. A gate, not a wizard — it routes only and persists NO role (the shell
// stays derived from the pairing edge; constitution). "Eigenen Zyklus tracken"
// marks the device-local completion flag and re-resolves the shell, which flips
// the gate to the Flower shell (refresh, not a navigation into a guarded-out
// screen — #147); "Partner:in folgen" opens Mate · Code eingeben (accept_invite).
// Completion of the follow path is the pairing edge itself, so the flag stays
// unset there — an abandoned follow choice simply re-shows this gate on relaunch.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { setOnboardingComplete } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { BrandMark } from '../../components/BrandMark';
import { Icon, type IconName } from '../../components/Icon';
import { useShell } from '../shell/ShellContext';

type Choice = {
  key: 'track' | 'follow';
  icon: IconName;
  title: string;
  body: string;
};

const CHOICES: readonly Choice[] = [
  {
    key: 'track',
    icon: 'cycle',
    title: 'Eigenen Zyklus tracken',
    body: 'Du loggst deinen Zyklus und behältst die volle Hoheit über deine Daten.',
  },
  {
    key: 'follow',
    icon: 'pairing',
    title: 'Partner:in folgen',
    body: 'Du gibst einen Einladungs-Code ein und bleibst eingestimmt.',
  },
];

export function OnboardingForkScreen() {
  const router = useRouter();
  const { refresh } = useShell();
  const [isBusy, setIsBusy] = useState(false);

  const choose = async (key: Choice['key']) => {
    if (isBusy) return;
    if (key === 'follow') {
      router.push('/accept-invite');
      return;
    }
    setIsBusy(true);
    await setOnboardingComplete();
    refresh();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BrandMark size={64} />
        <Text style={styles.wordmark}>Flowmate</Text>
        <Text style={styles.heading}>Wie nutzt du die App?</Text>
      </View>
      <View style={styles.choices}>
        {CHOICES.map((choice) => (
          <Pressable
            key={choice.key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => choose(choice.key)}
            disabled={isBusy}
          >
            <View style={styles.cardIcon}>
              <Icon name={choice.icon} size={26} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{choice.title}</Text>
              <Text style={styles.cardBody}>{choice.body}</Text>
            </View>
            <Icon name="chevron" size={20} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screen,
    justifyContent: 'center',
    gap: 34,
  },
  header: { alignItems: 'center', gap: 16 },
  // Wordmark: DM Sans 600 30/36 (H1 range, low end) — matches the Auth artboard.
  wordmark: {
    ...typography.h1,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.025 * 30,
    color: colors.text,
  },
  heading: {
    ...typography.h2,
    color: colors.text,
  },
  choices: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
  },
  cardPressed: { opacity: 0.7 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.inputDisabled,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 6 },
  // Card title: DM Sans 600 16 ls -0.02em; body: Inter 400 14/20.
  cardTitle: { ...typography.title, color: colors.text },
  cardBody: { ...typography.bodySm, color: colors.textMuted },
});
