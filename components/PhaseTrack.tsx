// 4-segment weighted phase track (docs/design.md Components: "Phase track:
// 4 weighted segments (menstrual/follicular/ovulation/luteal), inactive #352C42,
// active primary"). The segment weights are legibility-first per the measured
// artboard A5-0 (~24% / 32% / 17% / 27%), deliberately trading literal cycle
// durations for labels that fit (see spec-design-reconciliation-2, #152). The
// active segment is filled with the primary lavender accent; inactive segments
// use the inactive token. Labels sit below each segment, left-aligned at the
// segment start and allowed to overrun their segment width.
// Reusable by the Mate surface — pass the same currentPhase prop.
import { StyleSheet, Text, View } from 'react-native';

import type { Phase } from '../lib/prediction';
import { colors, typography } from '../lib/theme';

const PHASE_INACTIVE = '#352C42';

const SEGMENTS: readonly { key: Phase; label: string; weight: number }[] = [
  { key: 'menstrual', label: 'Menstruation', weight: 7 },
  { key: 'follicular', label: 'Follikel', weight: 10 },
  { key: 'ovulation', label: 'Eisprung', weight: 5 },
  { key: 'luteal', label: 'Luteal', weight: 8 },
] as const;

const TOTAL_WEIGHT = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);

export interface PhaseTrackProps {
  /**
   * The current cycle phase. The matching segment is rendered in the primary
   * lavender color; all others are inactive.
   */
  currentPhase: Phase;
}

/** 4-segment weighted phase bar with German labels. */
export function PhaseTrack({ currentPhase }: PhaseTrackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {SEGMENTS.map((seg, idx) => {
          const isActive = seg.key === currentPhase;
          const flex = seg.weight / TOTAL_WEIGHT;
          const isFirst = idx === 0;
          const isLast = idx === SEGMENTS.length - 1;
          return (
            <View
              key={seg.key}
              style={[
                styles.segment,
                {
                  flex,
                  backgroundColor: isActive ? colors.primary : PHASE_INACTIVE,
                  borderTopLeftRadius: isFirst ? 4 : 0,
                  borderBottomLeftRadius: isFirst ? 4 : 0,
                  borderTopRightRadius: isLast ? 4 : 0,
                  borderBottomRightRadius: isLast ? 4 : 0,
                  marginRight: isLast ? 0 : 2,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        {SEGMENTS.map((seg) => (
          <View
            key={seg.key}
            style={[styles.labelSlot, { flex: seg.weight / TOTAL_WEIGHT }]}
          >
            <Text
              style={[
                styles.label,
                { color: seg.key === currentPhase ? colors.primary : colors.textSubtle },
              ]}
            >
              {seg.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: { flexDirection: 'row', height: 6 },
  segment: { height: 6 },
  labels: { flexDirection: 'row' },
  // overflow: 'visible' lets a label overrun its (narrow) segment slot instead
  // of being clipped by RN's default overflow: 'hidden' — the design allows the
  // full label to extend past its segment start (artboard A5-0, #152).
  labelSlot: { overflow: 'visible' },
  label: {
    ...typography.caption,
  },
});
