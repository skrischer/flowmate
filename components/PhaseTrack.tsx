// 4-segment weighted phase track shared by the Flower home and the Mate
// attunement surface (docs/design.md Components: "Phase track"). ONE component
// with a per-surface segment variant — joined bar (Flower, default) or
// individual pills (Mate). The segment weights are legibility-first per the
// measured artboard A5-0 (~24% / 32% / 17% / 27%), deliberately trading literal
// cycle durations for labels that fit (see spec-design-reconciliation-2,
// #152/#241). The active segment is filled with the primary lavender accent and
// its label is highlighted (semibold + primary) for both variants; everything
// else uses the inactive/subtle tokens. Labels alternate around the bar —
// Menstruation + Eisprung below, Follikel + Luteal above — and each is
// positioned absolutely within its slot so the full German label renders on one
// line, free of wrapping, truncation, or ellipsis (overflow:visible alone does
// not stop RN wrapping a Text constrained by a flex slot).
import { StyleSheet, Text, View } from 'react-native';

import type { Phase } from '../lib/prediction';
import { colors, fonts, radii, typography } from '../lib/theme';

const PHASE_INACTIVE = '#352C42';

// Gap between pill segments (and the matching pill label rows so columns line
// up); spacing between joined bar segments; bar outer-end corner radius.
const PILL_GAP = 5;
const BAR_SEGMENT_SPACING = 2;
const BAR_END_RADIUS = 4;
// Explicit height for each label row so it does not collapse now that the
// labels are absolutely positioned (out of normal flow). ~the caption
// line-height (15), rounded up.
const LABEL_ROW_HEIGHT = 16;

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

type PhaseTrackVariant = 'bar' | 'pills';

export interface PhaseTrackProps {
  /**
   * The current cycle phase. The matching segment and its label are rendered in
   * the primary lavender color; all others are inactive.
   */
  currentPhase: Phase;
  /**
   * Segment treatment. `'bar'` (default, Flower) is a joined bar with rounded
   * outer ends; `'pills'` (Mate) is individually pill-rounded segments with a
   * row gap.
   */
  variant?: PhaseTrackVariant;
}

/**
 * One row of labels. Every segment keeps a flex slot so columns line up across
 * rows and with the bar, but only the segments assigned to this row's placement
 * are filled. The label is absolutely positioned (`left: 0`, plus `top: 0` for
 * the below row / `bottom: 0` for the above row) so it sizes to its intrinsic
 * width on one line and overflows freely into the adjacent empty slot.
 */
function LabelRow({
  placement,
  currentPhase,
  gap,
}: {
  placement: Placement;
  currentPhase: Phase;
  gap: number;
}) {
  const edgeStyle = placement === 'below' ? styles.labelBelow : styles.labelAbove;
  return (
    <View style={[styles.labelRow, { gap }]}>
      {SEGMENTS.map((seg) => (
        <View key={seg.key} style={[styles.labelSlot, { flex: seg.weight }]}>
          {seg.placement === placement ? (
            <Text
              style={[
                styles.label,
                edgeStyle,
                seg.key === currentPhase ? styles.labelActive : styles.labelInactive,
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

/** The segment row itself — joined bar or individual pills per the variant. */
function Track({
  currentPhase,
  variant,
}: {
  currentPhase: Phase;
  variant: PhaseTrackVariant;
}) {
  const isPills = variant === 'pills';
  return (
    <View style={[styles.track, isPills ? styles.trackPills : styles.trackBar]}>
      {SEGMENTS.map((seg, idx) => {
        const isActive = seg.key === currentPhase;
        const isFirst = idx === 0;
        const isLast = idx === SEGMENTS.length - 1;
        return (
          <View
            key={seg.key}
            style={[
              isPills ? styles.segmentPill : styles.segmentBar,
              {
                flex: seg.weight,
                backgroundColor: isActive ? colors.primary : PHASE_INACTIVE,
              },
              isPills
                ? null
                : {
                    borderTopLeftRadius: isFirst ? BAR_END_RADIUS : 0,
                    borderBottomLeftRadius: isFirst ? BAR_END_RADIUS : 0,
                    borderTopRightRadius: isLast ? BAR_END_RADIUS : 0,
                    borderBottomRightRadius: isLast ? BAR_END_RADIUS : 0,
                    marginRight: isLast ? 0 : BAR_SEGMENT_SPACING,
                  },
            ]}
          />
        );
      })}
    </View>
  );
}

/** 4-segment weighted phase track with German labels alternating around it. */
export function PhaseTrack({ currentPhase, variant = 'bar' }: PhaseTrackProps) {
  const gap = variant === 'pills' ? PILL_GAP : 0;
  return (
    <View style={styles.container}>
      <LabelRow placement="above" currentPhase={currentPhase} gap={gap} />
      <Track currentPhase={currentPhase} variant={variant} />
      <LabelRow placement="below" currentPhase={currentPhase} gap={gap} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: { flexDirection: 'row' },
  trackBar: { height: 6 },
  trackPills: { height: 7, gap: PILL_GAP },
  segmentBar: { height: 6 },
  segmentPill: { height: 7, borderRadius: radii.pill },
  labelRow: { flexDirection: 'row', height: LABEL_ROW_HEIGHT },
  labelSlot: { position: 'relative' },
  // Absolute positioning sizes the label to its intrinsic single-line width and
  // lets it overflow its (narrow) slot into the adjacent empty one — no wrap.
  label: { ...typography.caption, position: 'absolute', left: 0 },
  labelAbove: { bottom: 0 },
  labelBelow: { top: 0 },
  labelActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  labelInactive: { color: colors.textSubtle },
});
