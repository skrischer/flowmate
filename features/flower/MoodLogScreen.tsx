// Flower · Mood-Logging: log today's mood from the curated set of 6. Mood-only
// (no free-text note, no symptoms). Persistence via lib/data — no direct Supabase
// calls here. Not a prediction surface — no disclaimer rendered.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getDailyLog, upsertDailyLog, type Mood } from '../../lib/data';
import { colors, fonts, radii, spacing, typography } from '../../lib/theme';
import { Icon } from '../../components/Icon';
import { isValidIso } from '../cycle-logging/date';
import { todayIso } from './today';
import { MOOD_OPTIONS, parseMood } from './mood';

// Per-mood dot colors (design.md / Paper artboard "Flower · Mood-Logging").
// low (#8E8AA8) and anxious (#A88FB8) are mood-specific palette extensions not
// represented by existing system tokens.
const MOOD_DOT_COLORS: Record<Mood, string> = {
  content: colors.success,
  calm: colors.success,
  sensitive: colors.secondary,
  irritable: colors.danger,
  low: '#8E8AA8',
  anxious: '#A88FB8',
};

export function MoodLogScreen() {
  const router = useRouter();
  const date = todayIso();
  const [mood, setMood] = useState<Mood | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Prefill today's stored mood so re-logging shows the current value.
  // todayIso() is called inside the callback so the load always targets the
  // current calendar day, even if focus fires after midnight.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadMoodForDate(todayIso())
        .then((value) => { if (active) { setMood(value); setIsLoaded(true); } })
        .catch((cause: unknown) => {
          if (active) { setError(messageOf(cause, 'Laden fehlgeschlagen.')); setIsLoaded(true); }
        });
      return () => { active = false; };
    }, []),
  );

  const submit = async () => {
    if (!mood) { setError('Bitte eine Stimmung auswählen.'); return; }
    setError(null);
    setIsBusy(true);
    try {
      await upsertDailyLog({ date, mood });
      router.back();
    } catch (cause: unknown) {
      setError(messageOf(cause, 'Speichern fehlgeschlagen.'));
      setIsBusy(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const rows = pairOptions(MOOD_OPTIONS);

  return (
    <View style={styles.flex}>
      {/* Sheet header: close-X left, centred title, mirror spacer (#95) */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Icon name="close" size={16} color={colors.label} />
        </Pressable>
        <Text style={styles.title}>Stimmung</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Date chip — read-only pill showing the logged day (#96) */}
        <View style={styles.dateChip}>
          <Icon name="calendar" size={15} color={colors.primary} />
          <Text style={styles.dateChipText}>{formatDateChip(date)}</Text>
        </View>

        <Text style={styles.heading}>Wie fühlst du dich?</Text>

        {/* 2-column mood grid with colored dots + filled selected state (#97) */}
        <View style={styles.grid}>
          {rows.map((row) => (
            <View key={row[0]?.value ?? ''} style={styles.gridRow}>
              {row.map((option) => {
                const selected = option.value === mood;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.gridCell,
                      selected && styles.gridCellSelected,
                      pressed && styles.gridCellPressed,
                    ]}
                    onPress={() => setMood(option.value)}
                    disabled={isBusy}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: selected ? colors.onPrimary : MOOD_DOT_COLORS[option.value] },
                      ]}
                    />
                    <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {/* Pinned CTA (#95) */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isBusy && styles.ctaDisabled]}
          onPress={submit}
          disabled={isBusy}
        >
          {isBusy
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={styles.ctaText}>Speichern</Text>}
        </Pressable>
      </View>
    </View>
  );
}

async function loadMoodForDate(date: string): Promise<Mood | null> {
  const row = await getDailyLog(date);
  return row ? parseMood(row.mood) : null;
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

function pairOptions<T>(options: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));
  return rows;
}

/** Formats an ISO date as a German chip label, e.g. "Heute, 19. Juni". */
function formatDateChip(isoDate: string): string {
  if (!isValidIso(isoDate)) return isoDate;
  const [rawYear, rawMonth, rawDay] = isoDate.split('-');
  const month = Number(rawMonth ?? '0');
  const day = Number(rawDay ?? '0');
  const DE_MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  const monthName = DE_MONTHS[month - 1] ?? '';
  if (isoDate === todayIso()) return `Heute, ${day}. ${monthName}`;
  const year = Number(rawYear ?? '0');
  return `${day}. ${monthName} ${year}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 19,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.inputDisabled,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { opacity: 0.7 },
  title: { ...typography.title, fontSize: 18, lineHeight: 22, color: colors.text },
  headerSpacer: { width: 38, height: 38 },
  body: { flex: 1, paddingHorizontal: spacing.screen, gap: 18 },
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputDisabled,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  // Date chip: Inter 600 13/16, no tracking per the artboard (Label lh/ls differ).
  dateChipText: { ...typography.label, lineHeight: 16, letterSpacing: 0, color: colors.label },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.02 * 24,
    color: colors.text,
  },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 16,
    padding: 17,
  },
  gridCellSelected: { backgroundColor: colors.primary, borderWidth: 0 },
  gridCellPressed: { opacity: 0.7 },
  dot: { width: 11, height: 11, borderRadius: radii.pill, flexShrink: 0 },
  cellText: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 18, color: colors.label, flexShrink: 1 },
  cellTextSelected: { fontFamily: fonts.bodySemiBold, color: colors.onPrimary },
  error: { color: colors.danger, fontSize: 14 },
  ctaContainer: { paddingHorizontal: spacing.screen, paddingBottom: 30, paddingTop: 16 },
  cta: { backgroundColor: colors.primary, borderRadius: 15, padding: 17, alignItems: 'center' },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontFamily: fonts.bodySemiBold },
});
