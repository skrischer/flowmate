// Flower · Kalender (docs/design.md, spec-flower-experience.md): a hand-rolled
// month calendar (no calendar dependency) marking logged period days (solid),
// the predicted next-period start day and the fertile window (visually distinct
// from logged), with month navigation and the mandatory prediction disclaimer.
// Periods and the prediction are loaded once via useFlowerCalendar (lib/data +
// the pure engine behind it); the grid model is the pure features/flower/calendar
// helper. This surface never reimplements prediction and makes no Supabase calls.
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '../../components/Icon';
import { colors, radii, spacing } from '../../lib/theme';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  monthStartOf,
  monthTitle,
  shiftMonth,
  type DayCell,
  type DayMarker,
  type MonthGrid,
} from './calendar';
import { useFlowerCalendar } from './useFlowerCalendar';

export function CalendarScreen() {
  const router = useRouter();
  const { periods, prediction, isLoading, error } = useFlowerCalendar();
  const today = prediction?.today ?? null;
  const [monthStart, setMonthStart] = useState<string | null>(null);

  // Anchor the visible month to today on first load, then keep what the user
  // navigated to. today arrives from the single wiring-boundary clock read.
  const visibleMonth = monthStart ?? (today ? monthStartOf(today) : null);

  const grid = useMemo(() => {
    if (!visibleMonth || !today || !periods) {
      return null;
    }
    return buildMonthGrid(visibleMonth, periods, prediction?.prediction ?? null, today);
  }, [visibleMonth, today, periods, prediction]);

  if (isLoading || !grid || !visibleMonth) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.errorText}>Kalender nicht verfuegbar.</Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* #87: title left, both nav arrows grouped on the right */}
        <View style={styles.monthNav}>
          <Text style={styles.monthTitle}>{monthTitle(grid)}</Text>
          <View style={styles.navGroup}>
            <NavButton direction="back" onPress={() => setMonthStart(shiftMonth(visibleMonth, -1))} />
            <NavButton direction="forward" onPress={() => setMonthStart(shiftMonth(visibleMonth, 1))} />
          </View>
        </View>

        {/* #85: 4 dot-chip legend directly under the header, before the grid */}
        <Legend />

        <MonthGridView grid={grid} onDayPress={() => router.push('/period-form')} />

        {/* #87: calendar-specific disclaimer (outlined = predicted) */}
        <CalendarDisclaimer />

        {/* #86: tap-a-day hint + primary CTA */}
        <View style={styles.ctaBlock}>
          <Text style={styles.tapHint}>Tippe einen Tag an, um eine Periode einzutragen.</Text>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
            onPress={() => router.push('/period-form')}
          >
            <Icon name="plus" size={18} color={colors.primary} />
            <Text style={styles.ctaLabel}>Periode eintragen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// The weekday header plus the Monday-first weeks of day cells.
function MonthGridView({ grid, onDayPress }: { grid: MonthGrid; onDayPress: () => void }) {
  return (
    <View style={styles.gridBlock}>
      <View style={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.weeks.map((week) => (
          <View key={week[0]?.date ?? ''} style={styles.week}>
            {week.map((cell) => (
              <DayView key={cell.date} cell={cell} onPress={onDayPress} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// One day cell: a solid fill for logged days, an outlined ring for the predicted
// start day, a soft caramel fill for fertile days, and a ring for today. Tapping
// an in-month day opens the period log (the design's tap-a-day affordance).
function DayView({ cell, onPress }: { cell: DayCell; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cell,
        markerStyles[cell.marker],
        cell.isToday && styles.today,
        pressed && cell.inMonth && styles.cellPressed,
      ]}
      onPress={onPress}
      disabled={!cell.inMonth}
    >
      <Text style={[styles.cellText, !cell.inMonth && styles.cellTextOut, textStyles[cell.marker]]}>
        {cell.day}
      </Text>
    </Pressable>
  );
}

// #87: both arrows grouped right; direction prop drives which icon to render.
function NavButton({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
      onPress={onPress}
    >
      <Icon name={direction === 'back' ? 'back' : 'chevron'} size={18} color={colors.label} />
    </Pressable>
  );
}

// #85: 4 dot-chips — Periode (solid), prognostiziert (outline), fruchtbar (solid),
// heute (primary outline). Circular dots, wrapping row, sits above the grid.
function Legend() {
  return (
    <View style={styles.legend}>
      <LegendDot dotStyle={styles.dotLogged} label="Periode" />
      <LegendDot dotStyle={styles.dotPredicted} label="prognostiziert" />
      <LegendDot dotStyle={styles.dotFertile} label="fruchtbar" />
      <LegendDot dotStyle={styles.dotToday} label="heute" />
    </View>
  );
}

function LegendDot({ dotStyle, label }: { dotStyle: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// #87: calendar-specific disclaimer — explains that outlined days are predicted.
// Replaces the generic PredictionDisclaimer on this surface.
function CalendarDisclaimer() {
  return (
    <View style={styles.disclaimerRow}>
      <View style={styles.disclaimerMark}>
        <Text style={styles.disclaimerMarkText}>i</Text>
      </View>
      <Text style={styles.disclaimerText}>Umrandete Tage sind prognostiziert — keine Garantie.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  content: { padding: spacing.screen, gap: 18 },
  // #87: title left, navGroup right
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: { color: colors.text, fontSize: 24, fontWeight: '600', letterSpacing: -0.48 },
  navGroup: { flexDirection: 'row', gap: 8 },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.inputDisabled,
    borderColor: colors.hairline,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: { opacity: 0.7 },
  gridBlock: { gap: 6 },
  weekdays: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: { gap: 6 },
  week: { flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellPressed: { opacity: 0.6 },
  cellText: { color: colors.label, fontSize: 15, fontWeight: '600' },
  cellTextOut: { color: colors.hairline, fontWeight: '400' },
  loggedCell: { backgroundColor: colors.period, borderColor: 'transparent' },
  loggedText: { color: '#2A1E22' },
  predictedCell: { borderColor: colors.period },
  predictedText: { color: colors.period },
  fertileCell: { backgroundColor: colors.surfaceRaised, borderColor: 'transparent' },
  fertileText: { color: colors.secondary },
  today: { borderColor: colors.primary },
  // #85: legend row — wrapping chips above the grid
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 12, height: 12, borderRadius: radii.pill, borderWidth: 1.5, borderColor: 'transparent' },
  dotLogged: { backgroundColor: colors.period, borderColor: 'transparent' },
  dotPredicted: { backgroundColor: 'transparent', borderColor: colors.period },
  dotFertile: { backgroundColor: colors.secondary, borderColor: 'transparent' },
  dotToday: { backgroundColor: 'transparent', borderColor: colors.primary },
  legendLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  // #87: calendar-specific disclaimer
  disclaimerRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  disclaimerMark: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    borderWidth: 1.4,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  disclaimerMarkText: { color: colors.textSubtle, fontSize: 9, fontWeight: '700' },
  disclaimerText: { color: colors.textSubtle, fontSize: 12 },
  // #86: tap hint + CTA button
  ctaBlock: { alignItems: 'center', gap: 14, paddingTop: 4 },
  tapHint: { color: colors.textSubtle, fontSize: 13, textAlign: 'center' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.pill,
    height: 50,
    paddingHorizontal: 22,
  },
  ctaButtonPressed: { opacity: 0.7 },
  ctaLabel: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});

// Marker-driven cell and text styles, keyed off the pure grid model's DayMarker.
const markerStyles: Record<DayMarker, object> = {
  logged: styles.loggedCell,
  predicted: styles.predictedCell,
  fertile: styles.fertileCell,
  none: {},
};

const textStyles: Record<DayMarker, object> = {
  logged: styles.loggedText,
  predicted: styles.predictedText,
  fertile: styles.fertileText,
  none: {},
};
