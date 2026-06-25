// "WO [Flower] GERADE IST" section for the Mate attunement view (issue #109).
// Renders a 4-segment phase track for the owner's current phase + a reassurance
// card below. Shown only when a known phase is available (phase !== null).
//
// The track is rendered inline here (not via the shared components/PhaseTrack,
// which the Flower home screen owns) so the Mate surface can match the Paper
// "Mate · Eingestimmt" artboard (#135): individually pill-rounded segments with
// the design's balanced weights, and the current phase surfaced as a highlighted
// label per the settled decision (keep the labels, highlight the current phase).
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { colors, fonts, radii, typography } from '../../lib/theme';
import type { Phase } from '../../lib/prediction';

// Inactive segment fill (docs/design.md Phase track) — a one-off dark token not
// in the shared palette, matching the Paper artboard's #352C42.
const PHASE_INACTIVE = '#352C42';

// Segment weights from the Paper artboard (1 / 1.4 / 0.7 / 1.2): more balanced
// than a true cycle would be, so the German labels stay readable under each.
const SEGMENTS: readonly { key: Phase; label: string; weight: number }[] = [
  { key: 'menstrual', label: 'Menstruation', weight: 1 },
  { key: 'follicular', label: 'Follikel', weight: 1.4 },
  { key: 'ovulation', label: 'Eisprung', weight: 0.7 },
  { key: 'luteal', label: 'Luteal', weight: 1.2 },
] as const;

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
      <MatePhaseTrack phase={phase} />
      <ReassuranceCard />
    </View>
  );
}

// 4-segment pill track + per-phase labels, with the current phase highlighted.
// Named distinctly from the shared components/PhaseTrack to avoid shadowing it.
function MatePhaseTrack({ phase }: { phase: Phase }) {
  return (
    <View>
      <View style={styles.track}>
        {SEGMENTS.map((seg) => (
          <View
            key={seg.key}
            style={[
              styles.segment,
              {
                flex: seg.weight,
                backgroundColor: seg.key === phase ? colors.primary : PHASE_INACTIVE,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {SEGMENTS.map((seg) => (
          <View key={seg.key} style={{ flex: seg.weight }}>
            <Text
              style={seg.key === phase ? styles.labelActive : styles.label}
              numberOfLines={1}
            >
              {seg.label}
            </Text>
          </View>
        ))}
      </View>
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
  track: { flexDirection: 'row', gap: 5, height: 7 },
  segment: { height: 7, borderRadius: radii.pill },
  labels: { flexDirection: 'row', gap: 5, marginTop: 8 },
  label: { ...typography.caption, color: colors.textSubtle },
  labelActive: { ...typography.caption, fontFamily: fonts.bodySemiBold, color: colors.primary },
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
