// Flower · Zyklus-Historie (docs/design.md, spec-cycle-logging.md): the
// chronological list of logged periods, descending by start date, each row
// showing a colored dot, a month-name date range ("12.–17. Juni 2026"), and
// period-length meta ("6 Tage · Zyklus 29 Tage"). A stats card at the top
// shows Ø cycle length, Ø period length, and entry count. All data flows
// through lib/data — no direct Supabase calls.
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
import { cycleLengthStats } from '../../lib/prediction/cycle-stats';
import { colors, fonts, radii, spacing, typography } from '../../lib/theme';
import { Icon } from '../../components/Icon';
import { TopBar } from '../../components/TopBar';
import { formatDateRange } from './date';

// ---------------------------------------------------------------------------
// Derived stats helpers
// ---------------------------------------------------------------------------

/**
 * Cycle length in whole days for the period at `index` in a descending
 * (newest first) list. The newest entry (index 0) has no completed cycle
 * yet, so returns null.
 */
function cycleLengthAt(periods: Period[], index: number): number | null {
  const current = periods[index];
  const newer = periods[index - 1];
  if (current === undefined || newer === undefined) return null;
  return daysBetween(current.start_date, newer.start_date);
}

/** Period length in whole days (end - start + 1). Null when end_date absent. */
function periodLengthDays(period: Period): number | null {
  if (!period.end_date) return null;
  return daysBetween(period.start_date, period.end_date) + 1;
}

/** Mean period length in whole days across all entries that have an end_date. */
function avgPeriodLength(periods: Period[]): number | null {
  const lengths = periods.map(periodLengthDays).filter((v): v is number => v !== null);
  if (lengths.length === 0) return null;
  return Math.round(lengths.reduce((sum, n) => sum + n, 0) / lengths.length);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

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

  // Reload on focus so an entry logged or edited on the form screen appears
  // immediately when the user navigates back here.
  useFocusEffect(reload);

  // Map periods to PeriodStart shape required by cycle-stats.
  const periodStarts = (periods ?? []).map((p) => ({ startDate: p.start_date }));
  const stats = cycleLengthStats(periodStarts);
  const avgPeriod = periods ? avgPeriodLength(periods) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <TopBar title="Verlauf" />
      {periods === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={periods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {/* #92 Stats summary card */}
              <StatsCard
                avgCycle={stats?.median ?? null}
                avgPeriod={avgPeriod}
                entryCount={periods.length}
              />
              {/* #94 Section label */}
              <Text style={styles.sectionLabel}>ALLE PERIODEN</Text>
            </>
          }
          renderItem={({ item, index }) => (
            <PeriodRow
              period={item}
              cycleLength={cycleLengthAt(periods, index)}
              onPress={() =>
                router.push({ pathname: '/period-form', params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ?? 'Noch keine Periode eingetragen.'}
            </Text>
          }
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}

      {/* #94 CTA at bottom per design */}
      <View style={styles.ctaWrap}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.push('/period-form')}
        >
          <Text style={styles.ctaText}>Periode eintragen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Stats card (#92)
// ---------------------------------------------------------------------------

function StatsCard({
  avgCycle,
  avgPeriod,
  entryCount,
}: {
  avgCycle: number | null;
  avgPeriod: number | null;
  entryCount: number;
}) {
  return (
    <View style={styles.card}>
      <StatItem label="Ø Zyklus" value={avgCycle !== null ? String(avgCycle) : '—'} />
      <View style={styles.cardDivider} />
      <StatItem label="Ø Periode" value={avgPeriod !== null ? String(avgPeriod) : '—'} />
      <View style={styles.cardDivider} />
      <StatItem label="Einträge" value={String(entryCount)} />
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Period row (#93)
// ---------------------------------------------------------------------------

function PeriodRow({
  period,
  cycleLength,
  onPress,
}: {
  period: Period;
  cycleLength: number | null;
  onPress: () => void;
}) {
  // Month-name range per design: "12.–17. Juni 2026" (en dash), or the single
  // start day when no end_date is set yet.
  const dateLabel = formatDateRange(period.start_date, period.end_date);

  const pLen = periodLengthDays(period);
  const periodMeta = pLen !== null ? `${pLen} ${pLen === 1 ? 'Tag' : 'Tage'}` : null;
  const cycleMeta =
    cycleLength !== null
      ? `Zyklus ${cycleLength} ${cycleLength === 1 ? 'Tag' : 'Tage'}`
      : 'Aktueller Zyklus';
  const meta = periodMeta ? `${periodMeta} · ${cycleMeta}` : cycleMeta;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {/* Colored dot per design (#93) */}
      <View style={styles.dotWrap}>
        <View style={styles.dot} />
      </View>

      <View style={styles.rowMain}>
        <Text style={styles.rowDate}>{dateLabel}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>

      <Icon name="chevron" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: spacing.screen, paddingTop: 20, gap: 10 },
  listFooter: { height: 24 },

  // Stats card (#92). borderRadius 16 is the high end of the design.md md
  // radius range (14–16) — the StatsCard sits at 16 per the artboard.
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 22,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  // Stat number: DM Sans 600 24/30 per the artboard (not Title 16).
  statValue: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.text },
  // Stat label: Inter 500 12/16 per the artboard (not Caption 11).
  statLabel: { ...typography.caption, fontSize: 12, lineHeight: 16, color: colors.textMuted, letterSpacing: 0 },
  cardDivider: { width: 1, backgroundColor: colors.hairline, marginVertical: 4 },

  // Section label (#94)
  sectionLabel: { ...typography.caption, color: colors.textSubtle, letterSpacing: 0.08 * 11, marginBottom: 10 },

  // Period row (#93)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowPressed: { opacity: 0.7 },
  dotWrap: { justifyContent: 'center', alignItems: 'center', width: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.period },
  rowMain: { flex: 1 },
  // Date label: DM Sans 600 16/20 (Title) per the artboard (not Label Inter 13).
  rowDate: { ...typography.title, lineHeight: 20, color: colors.text },
  // Meta subtitle: Inter 400 13/16 per the artboard (not Caption Inter 500 11).
  rowMeta: { fontFamily: fonts.body, fontSize: 13, lineHeight: 16, color: colors.textMuted, marginTop: 2 },

  // CTA (#94 — bottom placement per design)
  ctaWrap: { paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 16, backgroundColor: colors.bg },
  cta: { backgroundColor: colors.primary, borderRadius: radii.md, padding: 17, alignItems: 'center' },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { ...typography.title, color: colors.onPrimary },

  empty: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: 32 },
});
