// Phase chip atom — pill with a status dot and a label.
// Design: surface-raised background, a small dot in the phase color, label text.
// Reused by the Flower phase card and any future Mate surface that shows the
// current phase label (Phase C).
import { StyleSheet, Text, View } from 'react-native';

import type { Phase } from '../lib/prediction';
import { colors, radii, typography } from '../lib/theme';

/** Phase color dot token — each cycle phase has a distinct accent. */
const PHASE_COLORS: Record<Phase, string> = {
  menstrual: colors.period,    // soft rose
  follicular: colors.success,  // sage
  ovulation: colors.secondary, // caramel (fertile peak)
  luteal: colors.primary,      // lavender
};

export interface PhaseChipProps {
  /** The current cycle phase. */
  phase: Phase;
  /** German display label for the phase. */
  label: string;
}

/** Pill chip showing a phase dot and the German phase label. */
export function PhaseChip({ phase, label }: PhaseChipProps) {
  const dotColor = PHASE_COLORS[phase] ?? colors.primary;
  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.label,
    // Phase-chip label: #C3B3E6 (light lavender) per the design artboards.
    color: '#C3B3E6',
  },
});
