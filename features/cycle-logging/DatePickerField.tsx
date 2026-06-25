// Flower · date-picker field for the period log/edit form (spec-cycle-logging.md).
// A labelled field that opens a hand-rolled month-calendar modal anchored to the
// current value (or today). Reuses the pure month-grid model from the Flower
// calendar (#71) so the grid math lives in one place — no new dependency, no
// native date-picker module. Selecting a day returns its ISO date (YYYY-MM-DD);
// the optional end field can be cleared. `minDate` blocks earlier days (end must
// not precede start). No raw health data here — just calendar days.
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
import { formatIso, todayIso } from './date';

type Props = {
  label: string;
  /** Selected day as YYYY-MM-DD, or '' when unset. */
  value: string;
  onChange: (iso: string) => void;
  /** Optional fields render a clear action and tolerate an empty value. */
  optional?: boolean;
  /** Days before this ISO day are not selectable (e.g. end >= start). */
  minDate?: string;
  /** A short helper line under the field. */
  hint?: string;
  disabled?: boolean;
};

/** Returns a relative label: 'Heute', 'Gestern', or the formatted ISO date. */
function relativeLabel(iso: string): string {
  const today = todayIso();
  if (iso === today) return 'Heute';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = `${yesterday.getMonth() + 1}`.padStart(2, '0');
  const day = `${yesterday.getDate()}`.padStart(2, '0');
  const yesterdayIso = `${year}-${month}-${day}`;
  if (iso === yesterdayIso) return 'Gestern';
  return formatIso(iso);
}

export function DatePickerField({
  label,
  value,
  onChange,
  optional,
  minDate,
  hint,
  disabled,
}: Props) {
  const today = todayIso();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthStartOf(value || today));

  // Anchor the visible month to the current value (or today) every time it opens.
  const openPicker = () => {
    setViewMonth(monthStartOf(value || today));
    setOpen(true);
  };

  const grid = useMemo(() => buildMonthGrid(viewMonth, [], null, today), [viewMonth, today]);

  const pick = (cell: DayCell) => {
    onChange(cell.date);
    setOpen(false);
  };

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
        accessibilityLabel={`${label}: ${value ? relativeLabel(value) : 'Datum waehlen'}`}
      >
        <Icon name="calendar" size={18} color={colors.textSubtle} />
        <Text style={value ? styles.fieldText : styles.placeholder}>
          {value
            ? `${relativeLabel(value)} · ${formatIso(value)}`
            : 'Datum waehlen'}
        </Text>
        <Icon name="chevron" size={18} color={colors.textSubtle} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Schliessen"
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
                  const selected = cell.date === value;
                  const blocked = minDate !== undefined && cell.date < minDate;
                  return (
                    <Pressable
                      key={cell.date}
                      style={styles.cell}
                      onPress={() => pick(cell)}
                      disabled={blocked}
                    >
                      <View
                        style={[
                          styles.dayWrap,
                          cell.isToday && !selected && styles.dayToday,
                          selected && styles.daySelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            !cell.inMonth && styles.dayOutMonth,
                            blocked && styles.dayBlocked,
                            selected && styles.daySelectedText,
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
              {optional && value ? (
                <Pressable
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.clearText}>Kein Enddatum</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                onPress={() => setOpen(false)}
              >
                <Text style={styles.closeText}>Schliessen</Text>
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
  label: { color: colors.label, fontSize: 13, fontWeight: '600' },
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
  // Field value: Inter 500 16/20 per the artboard (not 15, no weight).
  fieldText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, flex: 1 },
  placeholder: { color: colors.textSubtle, fontSize: 16, flex: 1 },
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
  daySelected: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 15 },
  dayOutMonth: { color: colors.textSubtle, opacity: 0.5 },
  dayBlocked: { color: colors.textSubtle, opacity: 0.3 },
  daySelectedText: { color: colors.onPrimary, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  actionPressed: { opacity: 0.7 },
  clearText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  closeText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
