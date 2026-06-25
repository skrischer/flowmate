// Attunement card for the Mate view: PhaseChip + warm headline + optional
// heads-up chip with clock icon (spec-mate-push.md). The mandatory prediction
// disclaimer lives at the bottom of MateAttunementScreen (#135), not in here.
// Phase-level only -- no raw data.
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { PhaseChip } from '../../components/PhaseChip';
import type { Phase } from '../../lib/prediction';
import { colors, radii, typography } from '../../lib/theme';
import type { MateAttunement } from './attunement-view';

// Heads-up chip surface and text (docs/design.md "Mate · Eingestimmt" artboard):
// one-off dark tokens not in the shared palette. The chip sits on the slightly
// darker #2A2233 with #D7D1DC text — a touch brighter than colors.label, the
// same brighter-label literal MoodLogScreen uses.
const HEADS_UP_SURFACE = '#2A2233';
const HEADS_UP_TEXT = '#D7D1DC';

// Warm headline builders per phase -- "informed, not instructed" (design.md).
// Each is a function accepting the Flower's name so the substitution is
// explicit and case-safe (no brittle pronoun search-replace).
const WARM_HEADLINES: Record<Phase, (name: string) => string> = {
  menstrual: (name) => `Gerade braucht ${name} Ruhe und Naehe.`,
  follicular: (name) => `${name} sammelt neue Energie.`,
  ovulation: (name) => `${name} ist besonders lebendig gerade.`,
  luteal: (name) => `${name} ist in einer ruhigeren Phase.`,
};

interface AttunementCardProps {
  data: MateAttunement;
  flowerName: string | null;
}

export function AttunementCard({ data, flowerName }: AttunementCardProps) {
  const name = flowerName ?? 'Sie';
  const warmHeadline = data.phase !== null ? WARM_HEADLINES[data.phase](name) : null;

  return (
    <View style={styles.card}>
      {data.phase !== null && data.phaseLabel !== null ? (
        <PhaseChip phase={data.phase} label={data.phaseLabel} />
      ) : null}

      {warmHeadline !== null ? (
        <Text style={styles.warmHeadline}>{warmHeadline}</Text>
      ) : null}

      {data.hint !== null ? (
        <Text style={styles.hint}>{data.hint}</Text>
      ) : null}

      {data.headsUp !== null ? (
        <View style={styles.headsUpChip}>
          <Icon name="clock" size={14} color={HEADS_UP_TEXT} />
          <Text style={styles.headsUpText}>{data.headsUp}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    // AttunementCard treatment per the artboard: radius 26, padding 24, gap 16 —
    // one step warmer than the shared radii.lg/spacing.screen card defaults.
    borderRadius: 26,
    padding: 24,
    gap: 16,
  },
  // Warm headline: DM Sans 600 27/32 per the artboard (between H2 22 and H1 34).
  warmHeadline: {
    ...typography.h2,
    fontSize: 27,
    lineHeight: 32,
    color: colors.text,
  },
  hint: {
    ...typography.bodySm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  headsUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: HEADS_UP_SURFACE,
    // Rounded-rect, not a pill: radius 14 (radii.md) per the artboard.
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 12,
    gap: 10,
  },
  // Heads-up chip text: Inter 600 13 (typography.label) per the artboard.
  headsUpText: {
    ...typography.label,
    color: HEADS_UP_TEXT,
  },
});
