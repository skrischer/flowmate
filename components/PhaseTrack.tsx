// 4-segment weighted phase track (docs/design.md Components: "Phase track:
// 4 weighted segments (menstrual/follicular/ovulation/luteal), inactive #352C42,
// active primary"). The segments have fixed proportional weights matching the
// average cycle: menstrual ~5d, follicular ~9d, ovulation ~2d, luteal ~14d
// (total 30). The active segment is filled with the primary lavender accent;
// inactive segments use the inactive token. Labels sit below each segment.
// Reusable: Mate surface can pass the same phase/cycleDay props.
import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../lib/theme';

type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

const PHASE_INACTIVE = '#352C42';

const SEGMENTS: readonly { key: Phase; label: string; weight: number }[] = [
  { key: 'menstrual', label: 'Menstruation', weight: 5 },
  { key: 'follicular', label: 'Follikel', weight: 9 },
  { key: 'ovulation', label: 'Eisprung', weight: 2 },
  { key: 'luteal', label: 'Luteal', weight: 14 },
] as const;

const TOTAL_WEIGHT = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);

export interface PhaseTrackProps {
  /**
   * The current cycle phase. The matching segment is rendered in the primary
   * lavender color; all others are inactive.
   */
  currentPhase: Phase;
  /**
   * Optional current cycle day (1-based). Not rendered by this component but
   * accepted so callers don't need to spread partial props when passing through.
   */
  cycleDay?: number;
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
          <View key={seg.key} style={{ flex: seg.weight / TOTAL_WEIGHT }}>
            <Text
              style={[
                styles.label,
                { color: seg.key === currentPhase ? colors.primary : colors.textSubtle },
              ]}
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

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: { flexDirection: 'row', height: 6 },
  segment: { height: 6 },
  labels: { flexDirection: 'row' },
  label: {
    ...typography.caption,
  },
});
