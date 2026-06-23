// Ended / disconnected state for the Mate attunement view (issue #110).
// Shown when the pairing is revoked or there is no active edge.
// Centered hero layout: icon + headline + body + "Code eingeben" CTA back to
// Mate · Code eingeben (issue #134) + data-sovereignty note.
// No prediction disclaimer here (no prediction data shown).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon } from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface EndedViewProps {
  flowerName: string | null;
}

export function EndedView({ flowerName }: EndedViewProps) {
  const router = useRouter();
  const bodyText =
    flowerName !== null
      ? `${flowerName} teilt aktuell keine Einstimmung mehr mit dir. Du erhaeltst keine Hinweise, bis sie dich erneut einlaedt.`
      : 'Aktuell wird keine Einstimmung mit dir geteilt. Du erhaeltst keine Hinweise, bis du erneut eingeladen wirst.';
  const sovereigntyNote =
    flowerName !== null ? `${flowerName} teilt nur, was sie moechte.` : null;

  return (
    <View style={styles.hero}>
      <View style={styles.iconRing}>
        <Icon name="attunement" size={28} color={colors.textSubtle} />
      </View>
      <Text style={styles.headline}>Verbindung beendet</Text>
      <Text style={styles.body}>{bodyText}</Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => router.push('/accept-invite')}
      >
        <Text style={styles.ctaText}>Code eingeben</Text>
      </Pressable>
      {sovereigntyNote !== null ? (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>{sovereigntyNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: 48,
    gap: 18,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { ...typography.title, color: colors.onPrimary },
  noteCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.screen,
  },
  noteText: {
    ...typography.bodySm,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
