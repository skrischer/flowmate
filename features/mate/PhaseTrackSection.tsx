// "WO [Flower] GERADE IST" section for the Mate attunement view (issue #109).
// Renders a PhaseTrack for the owner's current phase + a reassurance card below.
// Shown only when a known phase is available (phase !== null).
import { StyleSheet, Text, View } from 'react-native';

import { PhaseTrack } from '../../components/PhaseTrack';
import { colors, radii, spacing, typography } from '../../lib/theme';
import type { Phase } from '../../lib/prediction';

interface PhaseTrackSectionProps {
  phase: Phase;
  flowerName: string | null;
}

export function PhaseTrackSection({ phase, flowerName }: PhaseTrackSectionProps) {
  const sectionLabel =
    flowerName !== null ? `WO ${flowerName.toUpperCase()} GERADE IST` : 'WO SIE GERADE IST';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      <View style={styles.trackCard}>
        <PhaseTrack currentPhase={phase} />
      </View>
      <ReassuranceCard />
    </View>
  );
}

function ReassuranceCard() {
  return (
    <View style={styles.reassuranceCard}>
      <Text style={styles.reassuranceText}>
        Du musst nichts verwalten. Einfach da sein und mitschwingen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    // All-caps section labels use wider tracking than body captions.
    // 0.08em × 11px = 0.88dp (twice the caption token's 0.04em base).
    // design.md caption spec range: 0.04–0.16em; 0.08em is mid-range for labels.
    letterSpacing: 0.08 * 11,
  },
  trackCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.screen,
  },
  reassuranceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.screen,
  },
  reassuranceText: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
