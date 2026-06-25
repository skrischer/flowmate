// 'Diese Woche' week-glance strip for the Flower home (#77).
// Shows Mon-Sun of the current week; today is highlighted by filling the whole
// day column (weekday label + day number + indicator dot) with a primary
// rounded container (artboard BS-0: r14, vertical padding 9, gap 7). Indicator
// dots sit below days that have logged period data or a mood entry. A "Kalender"
// link in the header navigates to /calendar.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '../lib/theme';

/** A single day's data for the week strip. */
export interface WeekDay {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Day of month (1-31). */
  day: number;
  /** Abbreviated German weekday label (Mo/Di/Mi/Do/Fr/Sa/So). */
  weekLabel: string;
  /** True when this is today. */
  isToday: boolean;
  /** True when a period log covers this day. */
  hasPeriodLog: boolean;
  /** True when a mood log exists for this day. */
  hasMoodLog: boolean;
}

export interface WeekGlanceProps {
  /** The 7 days Mon-Sun to display. Build via `buildWeekDays`. */
  days: readonly WeekDay[];
  /** Called when the "Kalender" link is tapped. */
  onCalendar: () => void;
}

/** The Mon-Sun week strip with the filled today column, log dots, and a calendar link. */
export function WeekGlance({ days, onCalendar }: WeekGlanceProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Diese Woche</Text>
        <Pressable onPress={onCalendar} hitSlop={8}>
          <Text style={styles.calendarLink}>Kalender</Text>
        </Pressable>
      </View>
      <View style={styles.strip}>
        {days.map((d) => (
          <DayCell key={d.date} day={d} />
        ))}
      </View>
    </View>
  );
}

function DayCell({ day }: { day: WeekDay }) {
  const hasIndicator = day.hasPeriodLog || day.hasMoodLog;
  return (
    <View style={[styles.dayCol, day.isToday && styles.dayColToday]}>
      <Text style={[styles.weekLabel, day.isToday && styles.weekLabelToday]}>{day.weekLabel}</Text>
      <Text style={[styles.dayNumber, day.isToday && styles.dayNumberToday]}>{day.day}</Text>
      <View style={styles.dotRow}>
        {day.hasPeriodLog ? (
          <View style={[styles.dot, day.isToday ? styles.dotToday : styles.dotPeriod]} />
        ) : null}
        {day.hasMoodLog ? (
          <View style={[styles.dot, day.isToday ? styles.dotToday : styles.dotMood]} />
        ) : null}
        {!hasIndicator ? <View style={styles.dotPlaceholder} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No raised surface: per design only the prediction card is a raised card; the
  // week glance sits on the base background (#151).
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  calendarLink: {
    ...typography.navLink,
    color: colors.primary,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // The day column doubles as the today marker container: weekday label, day
  // number, and dot row stack inside it with the design's internal gap (7).
  dayCol: {
    alignItems: 'center',
    gap: 7,
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  // Per design (artboard BS-0) the today marker fills the whole column with a
  // primary rounded container (r14) enclosing all three elements.
  dayColToday: {
    backgroundColor: colors.primary,
  },
  weekLabel: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  weekLabelToday: {
    color: colors.onPrimary,
  },
  // Day numbers: DM Sans 600 15, color #C9C2CF (colors.label) per the artboard.
  dayNumber: {
    ...typography.sectionTitle,
    color: colors.label,
  },
  dayNumberToday: {
    color: colors.onPrimary,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radii.pill,
  },
  dotPeriod: {
    backgroundColor: colors.period,
  },
  dotMood: {
    backgroundColor: colors.primary,
  },
  // On the filled today column the period/mood dots would lose contrast on the
  // primary fill, so they render in the on-primary tone instead.
  dotToday: {
    backgroundColor: colors.onPrimary,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
});
