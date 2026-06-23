// Attunement card for the Mate view: PhaseChip + warm headline + optional
// heads-up chip with clock icon + mandatory prediction disclaimer (spec-mate-push.md).
// Phase-level only -- no raw data.
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { PhaseChip } from '../../components/PhaseChip';
import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
import type { Phase } from '../../lib/prediction';
import { colors, radii, spacing, typography } from '../../lib/theme';
import type { MateAttunement } from './attunement-view';

// Warm headline per phase -- "informed, not instructed" (design.md).
const WARM_HEADLINES: Record<Phase, string> = {
  menstrual: 'Gerade braucht sie Ruhe und Naehe.',
  follicular: 'Sie sammelt neue Energie.',
  ovulation: 'Sie ist besonders lebendig gerade.',
  luteal: 'Sie ist in einer ruhigeren Phase.',
};

interface AttunementCardProps {
  data: MateAttunement;
  flowerName: string | null;
}

export function AttunementCard({ data, flowerName }: AttunementCardProps) {
  const name = flowerName ?? 'Sie';
  const warmHeadline =
    data.phase !== null
      ? (WARM_HEADLINES[data.phase] ?? null)
      : null;

  return (
    <View style={styles.card}>
      {data.phase !== null && data.phaseLabel !== null ? (
        <PhaseChip phase={data.phase} label={data.phaseLabel} />
      ) : null}

      {warmHeadline !== null ? (
        <Text style={styles.warmHeadline}>{name !== 'Sie' ? warmHeadline.replace('Sie', name) : warmHeadline}</Text>
      ) : null}

      {data.hint !== null ? (
        <Text style={styles.hint}>{data.hint}</Text>
      ) : null}

      {data.headsUp !== null ? (
        <View style={styles.headsUpChip}>
          <Icon name="clock" size={14} color={colors.secondary} />
          <Text style={styles.headsUpText}>{data.headsUp}</Text>
        </View>
      ) : null}

      <PredictionDisclaimer />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.screen,
    gap: 14,
  },
  warmHeadline: {
    ...typography.h2,
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
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  headsUpText: {
    ...typography.label,
    color: colors.secondary,
  },
});
