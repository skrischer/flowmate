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

import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
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
        <View style={styles.monthNav}>
          <NavButton label="<" onPress={() => setMonthStart(shiftMonth(visibleMonth, -1))} />
          <Text style={styles.monthTitle}>{monthTitle(grid)}</Text>
          <NavButton label=">" onPress={() => setMonthStart(shiftMonth(visibleMonth, 1))} />
        </View>

        <MonthGridView grid={grid} onDayPress={() => router.push('/period-form')} />

        <Legend />
        <PredictionDisclaimer />
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

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
      onPress={onPress}
    >
      <Text style={styles.navButtonText}>{label}</Text>
    </Pressable>
  );
}

// Reads the day highlights so logged vs predicted vs fertile are distinguishable.
function Legend() {
  return (
    <View style={styles.legend}>
      <LegendItem swatchStyle={styles.swatchLogged} label="Periode (eingetragen)" />
      <LegendItem swatchStyle={styles.swatchPredicted} label="Periode (Prognose)" />
      <LegendItem swatchStyle={styles.swatchFertile} label="Fruchtbares Fenster" />
    </View>
  );
}

function LegendItem({ swatchStyle, label }: { swatchStyle: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatchStyle]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
  content: { padding: spacing.screen, gap: 20 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: { opacity: 0.7 },
  navButtonText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  gridBlock: { gap: 6 },
  weekdays: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 12,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellPressed: { opacity: 0.6 },
  cellText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  cellTextOut: { color: colors.textSubtle, fontWeight: '400' },
  loggedCell: { backgroundColor: colors.period },
  loggedText: { color: colors.onPrimary },
  predictedCell: { borderColor: colors.period, borderStyle: 'dashed' },
  predictedText: { color: colors.period },
  fertileCell: { backgroundColor: colors.surfaceRaised, borderColor: colors.secondary },
  fertileText: { color: colors.secondary },
  today: { borderColor: colors.primary },
  legend: { gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 18, height: 18, borderRadius: radii.sm, borderWidth: 1 },
  swatchLogged: { backgroundColor: colors.period, borderColor: colors.period },
  swatchPredicted: { borderColor: colors.period, borderStyle: 'dashed' },
  swatchFertile: { backgroundColor: colors.surfaceRaised, borderColor: colors.secondary },
  legendLabel: { color: colors.textMuted, fontSize: 13 },
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
