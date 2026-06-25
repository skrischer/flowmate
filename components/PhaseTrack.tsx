// 4-segment weighted phase track (docs/design.md Components: "Phase track:
// 4 weighted segments (menstrual/follicular/ovulation/luteal), inactive #352C42,
// active primary"). The segment weights are legibility-first per the measured
// artboard A5-0 (~24% / 32% / 17% / 27%), deliberately trading literal cycle
// durations for labels that fit (see spec-design-reconciliation-2, #152). The
// active segment is filled with the primary lavender accent; inactive segments
// use the inactive token. Labels alternate around the bar — Menstruation +
// Eisprung below, Follikel + Luteal above — so each renders in full without
// crowding or wrapping (see spec-design-reconciliation-2, #228).
// Reusable by the Mate surface — pass the same currentPhase prop.
import { StyleSheet, Text, View } from 'react-native';

import type { Phase } from '../lib/prediction';
import { colors, typography } from '../lib/theme';

const PHASE_INACTIVE = '#352C42';

type Placement = 'above' | 'below';

const SEGMENTS: readonly {
  key: Phase;
  label: string;
  weight: number;
  placement: Placement;
}[] = [
  { key: 'menstrual', label: 'Menstruation', weight: 7, placement: 'below' },
  { key: 'follicular', label: 'Follikel', weight: 10, placement: 'above' },
  { key: 'ovulation', label: 'Eisprung', weight: 5, placement: 'below' },
  { key: 'luteal', label: 'Luteal', weight: 8, placement: 'above' },
] as const;

const TOTAL_WEIGHT = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);

export interface PhaseTrackProps {
  /**
   * The current cycle phase. The matching segment is rendered in the primary
   * lavender color; all others are inactive.
   */
  currentPhase: Phase;
}

/**
 * One row of labels. Every segment gets a flex slot so columns line up across
 * rows and with the bar, but only the segments assigned to this row's placement
 * are filled — the rest are empty spacers preserving horizontal alignment.
 */
function LabelRow({
  placement,
  currentPhase,
}: {
  placement: Placement;
  currentPhase: Phase;
}) {
  return (
    <View style={styles.labels}>
      {SEGMENTS.map((seg) => (
        <View
          key={seg.key}
          style={[styles.labelSlot, { flex: seg.weight / TOTAL_WEIGHT }]}
        >
          {seg.placement === placement ? (
            <Text
              style={[
                styles.label,
                {
                  color:
                    seg.key === currentPhase ? colors.primary : colors.textSubtle,
                },
              ]}
            >
              {seg.label}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** 4-segment weighted phase bar with German labels alternating around it. */
export function PhaseTrack({ currentPhase }: PhaseTrackProps) {
  return (
    <View style={styles.container}>
      <LabelRow placement="above" currentPhase={currentPhase} />
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
      <LabelRow placement="below" currentPhase={currentPhase} />
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
