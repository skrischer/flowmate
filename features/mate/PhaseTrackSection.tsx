// "WO [Flower] GERADE IST" section for the Mate attunement view (issue #109).
// Renders the shared 4-segment phase track (pills variant) for the owner's
// current phase + a reassurance card below. Shown only when a known phase is
// available (phase !== null). The track itself lives in components/PhaseTrack —
// this section only adds the "WO … IST" label and the reassurance card.
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { PhaseTrack } from '../../components/PhaseTrack';
import { colors, fonts, typography } from '../../lib/theme';
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
      <PhaseTrack currentPhase={phase} variant="pills" />
      <ReassuranceCard />
    </View>
  );
}

function ReassuranceCard() {
  return (
    <View style={styles.reassuranceCard}>
      <Icon name="attunement" size={22} color={colors.primary} />
      <Text style={styles.reassuranceText}>
        Du musst nichts verwalten. Einfach da sein und mitschwingen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  // Section label "WO … IST" per the artboard: Inter 600 12px, tracking 0.06em
  // (0.72dp) — distinct from the caption token (Inter 500 11px).
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSubtle,
    letterSpacing: 0.06 * 12,
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    // Reassurance card per the artboard: radius 18, paddingHorizontal 18.
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  reassuranceText: {
    ...typography.bodySm,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 20,
  },
});
