// Flower · range picker field for the period log/edit form
// (spec-period-range-picker.md). A labelled field that opens a hand-rolled month
// calendar selecting a start + an optional end over ONE grid. Reuses the pure
// month-grid model (features/flower/calendar.ts) and the pure range-selection
// model (range-selection.ts) so no grid math or selection logic lives here — and
// no native date-picker dependency. The first tap anchors the start, a tap on/
// after it sets the end (the span is filled), a tap before it re-anchors the
// start. After the end is tapped the calendar stays open: "Fertig" applies +
// closes, "Läuft noch" closes with the end left open (the default resting state).
// No raw health data here — just calendar days.
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  monthStartOf,
  monthTitle,
  shiftMonth,
  type DayCell,
} from '../flower/calendar';
import { Icon } from '../../components/Icon';
import { colors, fonts, radii } from '../../lib/theme';
import { formatDateRange, todayIso } from './date';
import { rangeRoleOf, selectDay, type RangeSelection } from './range-selection';

type Props = {
  label: string;
  /** Selected start day as YYYY-MM-DD, or '' when unset. */
  startValue: string;
  /** Selected end day as YYYY-MM-DD, or null for an open end ("läuft noch"). */
  endValue: string | null;
  /** Emits the chosen start + nullable end on apply ("Fertig" / "Läuft noch"). */
  onChange: (start: string, end: string | null) => void;
  /** Empty-state text shown when no start is selected. */
  placeholderLabel?: string;
  /** A short helper line under the field. */
  hint?: string;
  disabled?: boolean;
};

// Soft lavender tint for the days strictly between the two endpoints — the
// primary token at ~15 % opacity (8-digit RGBA alpha), derived from the token so
// it tracks any palette change, mirroring lib/theme's `successTint`.
const RANGE_FILL = `${colors.primary}26`;

// The collapsed field label: the formatted range, or start + "läuft noch" for an
// open end (the default resting state). Empty start falls back to the placeholder.
function rangeLabel(start: string, end: string | null, placeholder: string): string {
  if (!start) {
    return placeholder;
  }
  if (end === null) {
    return `${formatDateRange(start, null)} · läuft noch`;
  }
  return formatDateRange(start, end);
}

export function DateRangeField({
  label,
  startValue,
  endValue,
  onChange,
  placeholderLabel = 'Zeitraum wählen',
  hint,
  disabled,
}: Props) {
  const today = todayIso();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeSelection>({ start: startValue, end: endValue });
  const [viewMonth, setViewMonth] = useState(() => monthStartOf(startValue || today));

  // Anchor the visible month to the current start (or today) and seed the draft
  // from the current value every time the picker opens.
  const openPicker = () => {
    setDraft({ start: startValue, end: endValue });
    setViewMonth(monthStartOf(startValue || today));
    setOpen(true);
  };

  const grid = useMemo(() => buildMonthGrid(viewMonth, [], null, today), [viewMonth, today]);

  const tap = (cell: DayCell) => setDraft((current) => selectDay(current, cell.date));

  const applyDone = () => {
    onChange(draft.start, draft.end);
    setOpen(false);
  };

  const applyOpenEnd = () => {
    onChange(draft.start, null);
    setOpen(false);
  };

  const fieldValue = rangeLabel(startValue, endValue, placeholderLabel);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.field,
          pressed && styles.fieldPressed,
          disabled && styles.fieldDisabled,
        ]}
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${fieldValue}`}
      >
        <Icon name="calendar" size={18} color={colors.textSubtle} />
        <Text style={startValue ? styles.fieldText : styles.placeholder}>{fieldValue}</Text>
        <Icon name="chevron" size={18} color={colors.textSubtle} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Schließen"
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Pressable
                hitSlop={10}
                onPress={() => setViewMonth(shiftMonth(viewMonth, -1))}
                style={styles.nav}
              >
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthTitle(grid)}</Text>
              <Pressable
                hitSlop={10}
                onPress={() => setViewMonth(shiftMonth(viewMonth, 1))}
                style={styles.nav}
              >
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((weekday) => (
                <Text key={weekday} style={styles.weekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            {grid.weeks.map((week) => (
              <View key={week[0]?.date ?? monthTitle(grid)} style={styles.weekRow}>
                {week.map((cell) => {
                  const role = rangeRoleOf(draft, cell.date);
                  const endpoint = role === 'start' || role === 'end';
                  return (
                    <Pressable key={cell.date} style={styles.cell} onPress={() => tap(cell)}>
                      <View
                        style={[
                          styles.dayWrap,
                          cell.isToday && role === 'none' && styles.dayToday,
                          role === 'between' && styles.dayBetween,
                          endpoint && styles.dayEndpoint,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            !cell.inMonth && styles.dayOutMonth,
                            endpoint && styles.dayEndpointText,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                onPress={applyOpenEnd}
                disabled={!draft.start}
              >
                <Text style={styles.openEndText}>Läuft noch</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  styles.actionPrimary,
                  pressed && styles.actionPressed,
                ]}
                onPress={applyDone}
                disabled={!draft.start}
              >
                <Text style={styles.doneText}>Fertig</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 8 },
  label: { color: colors.textSubtle, fontSize: 13, fontWeight: '600' },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldPressed: { opacity: 0.7 },
  fieldDisabled: { opacity: 0.5 },
  // Field value: Inter 500 16/20 per the artboard.
  fieldText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, flex: 1 },
  placeholder: { color: colors.textMuted, fontSize: 16, flex: 1 },
  hint: { color: colors.textSubtle, fontSize: 12 },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  navText: { color: colors.text, fontSize: 22, fontWeight: '600' },
  monthTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 6,
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  dayBetween: { backgroundColor: RANGE_FILL },
  dayEndpoint: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 15 },
  dayOutMonth: { color: colors.textSubtle, opacity: 0.5 },
  dayEndpointText: { color: colors.onPrimary, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionPressed: { opacity: 0.7 },
  openEndText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  doneText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
