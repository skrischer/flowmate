// Flower · Zyklus-Historie (docs/design.md, spec-cycle-logging.md): the
// chronological list of logged periods, descending by start date, each row
// showing the cycle length to the next-newer period, with a "Periode eintragen"
// CTA. Tapping a row opens the log/edit form. All data flows through lib/data —
// this component makes no direct Supabase calls. Cycle length is a fact derived
// from two logged starts, not a prediction, so no disclaimer applies.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { listPeriods, type Period } from '../../lib/data';
import { daysBetween } from '../../lib/prediction/dates';
import { colors, radii, spacing } from '../../lib/theme';
import { formatIso } from './date';

/**
 * Cycle length in whole days for the period at `index` in a descending (newest
 * first) list: the span from this period's start to the next-newer start. The
 * newest period (index 0) has no completed cycle yet, so returns null.
 */
function cycleLengthAt(periods: Period[], index: number): number | null {
  const current = periods[index];
  const newer = periods[index - 1];
  if (current === undefined || newer === undefined) {
    return null;
  }
  return daysBetween(current.start_date, newer.start_date);
}

export function PeriodHistoryScreen() {
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    let active = true;
    setError(null);
    listPeriods()
      .then((rows) => {
        if (active) setPeriods(rows);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
          setPeriods([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Reload on focus so an entry logged or edited on the form screen shows up
  // immediately when the user returns here.
  useFocusEffect(reload);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => router.push('/period-form')}
      >
        <Text style={styles.ctaText}>Periode eintragen</Text>
      </Pressable>

      {periods === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={periods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <PeriodRow
              period={item}
              cycleLength={cycleLengthAt(periods, index)}
              onPress={() => router.push({ pathname: '/period-form', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ?? 'Noch keine Periode eingetragen.'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function PeriodRow({
  period,
  cycleLength,
  onPress,
}: {
  period: Period;
  cycleLength: number | null;
  onPress: () => void;
}) {
  const range = period.end_date
    ? `${formatIso(period.start_date)} - ${formatIso(period.end_date)}`
    : formatIso(period.start_date);
  const cycleMeta =
    cycleLength === null
      ? 'Aktueller Zyklus'
      : `Zykluslänge: ${cycleLength} ${cycleLength === 1 ? 'Tag' : 'Tage'}`;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowDate}>{range}</Text>
        <Text style={styles.rowMeta}>{cycleMeta}</Text>
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
    marginHorizontal: spacing.screen,
    marginTop: 16,
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  list: { padding: spacing.screen, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 32 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 18,
  },
  rowPressed: { opacity: 0.7 },
  rowMain: { flex: 1 },
  rowDate: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  chevron: { color: colors.textSubtle, fontSize: 16 },
});
