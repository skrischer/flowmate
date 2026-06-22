// Flower · Zyklus-Historie (docs/design.md, spec-cycle-logging.md): the
// chronological list of logged periods, descending by start date, with a
// "Periode eintragen" CTA. Tapping a row opens the log/edit form. All data
// flows through lib/data — this component makes no direct Supabase calls.
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
import { colors, radii, spacing } from '../../lib/theme';
import { formatIso } from './date';

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
          renderItem={({ item }) => (
            <PeriodRow
              period={item}
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

function PeriodRow({ period, onPress }: { period: Period; onPress: () => void }) {
  const range = period.end_date
    ? `${formatIso(period.start_date)} - ${formatIso(period.end_date)}`
    : formatIso(period.start_date);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.rowDate}>{range}</Text>
        <Text style={styles.rowMeta}>
          {period.end_date ? 'Start und Ende' : 'Nur Start'}
        </Text>
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
  rowDate: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  chevron: { color: colors.textSubtle, fontSize: 16 },
});
