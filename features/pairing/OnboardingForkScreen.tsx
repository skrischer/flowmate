// Shared · Onboarding (docs/design.md, spec-pairing.md): the first-run fork after
// sign-up. A gate, not a wizard — it routes only and persists NO role (the shell
// stays derived from the pairing edge; constitution). "Eigenen Zyklus tracken"
// marks the device-local completion flag and lands on the Flower shell;
// "Partner:in folgen" opens Mate · Code eingeben (accept_invite). Completion of
// the follow path is the pairing edge itself, so the flag stays unset there — an
// abandoned follow choice simply re-shows this gate on relaunch.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { setOnboardingComplete } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';

type Choice = {
  key: 'track' | 'follow';
  title: string;
  body: string;
};

const CHOICES: readonly Choice[] = [
  {
    key: 'track',
    title: 'Eigenen Zyklus tracken',
    body: 'Du loggst deinen Zyklus und behaeltst die volle Hoheit ueber deine Daten.',
  },
  {
    key: 'follow',
    title: 'Partner:in folgen',
    body: 'Du gibst einen Einladungs-Code ein und bleibst eingestimmt.',
  },
];

export function OnboardingForkScreen() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  const choose = async (key: Choice['key']) => {
    if (isBusy) return;
    if (key === 'follow') {
      router.push('/accept-invite');
      return;
    }
    setIsBusy(true);
    await setOnboardingComplete();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <View style={styles.logoMark} />
        </View>
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
            <View style={styles.cardIcon} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{choice.title}</Text>
              <Text style={styles.cardBody}>{choice.body}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
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
    gap: 40,
  },
  header: { alignItems: 'center', gap: 16 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 34,
    height: 18,
    borderColor: colors.primary,
    borderTopWidth: 2.5,
    borderBottomWidth: 2.5,
    borderRadius: radii.pill,
  },
  wordmark: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
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
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    flexShrink: 0,
  },
  cardText: { flex: 1, gap: 6 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  cardBody: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  chevron: { color: colors.textSubtle, fontSize: 20, flexShrink: 0 },
});
