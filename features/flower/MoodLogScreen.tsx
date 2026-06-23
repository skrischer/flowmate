// Flower · Mood-Logging (docs/design.md, spec-flower-experience.md): log or
// update today's (or a past day's) mood from the curated set of 6. Mood-only by
// design — no free-text note, no symptoms (vision non-goal: no quantified-self
// tracker). All persistence runs through lib/data's daily_logs CRUD; this
// component makes no direct Supabase calls. Not a prediction surface, so no
// "Prognose"-disclaimer is rendered here.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getDailyLog, upsertDailyLog, type Mood } from '../../lib/data';
import { colors, fonts, radii, spacing, typography } from '../../lib/theme';
import { Icon } from '../../components/Icon';
import { isValidIso } from '../cycle-logging/date';
import { todayIso } from './today';
import { MOOD_OPTIONS, parseMood } from './mood';

// Per-mood dot colors derived from the Heather Dark palette (design.md / Paper
// artboard "Flower · Mood-Logging"). Keeps color decisions out of render logic.
const MOOD_DOT_COLORS: Record<Mood, string> = {
  content: colors.success,       // sage — positive
  calm: colors.success,          // sage — positive
  sensitive: colors.secondary,   // caramel — warm/neutral
  irritable: colors.danger,      // soft rose — tense
  low: '#8E8AA8',                 // muted lavender-grey
  anxious: '#A88FB8',             // soft violet
};

export function MoodLogScreen() {
  const router = useRouter();
  const [date] = useState(todayIso());
  const [mood, setMood] = useState<Mood | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // On open, prefill today's entry (if one exists) so re-logging the same day
  // shows the stored mood and updates rather than appearing empty.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadMoodForDate(todayIso())
        .then((value) => {
          if (!active) return;
          setMood(value);
          setIsLoaded(true);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setError(messageOf(cause, 'Laden fehlgeschlagen.'));
          setIsLoaded(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const submit = async () => {
    if (!mood) {
      setError('Bitte eine Stimmung auswaehlen.');
      return;
    }
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

  // Pair up mood options into rows of two for the 2-column grid.
  const rows = pairOptions(MOOD_OPTIONS);

  return (
    <View style={styles.flex}>
      {/* Sheet header: close-X left, title centre, spacer right (#95) */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Icon name="close" size={16} color={colors.label} />
        </Pressable>
        <Text style={styles.title}>Stimmung</Text>
        {/* Spacer mirrors the close button to keep the title centred */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable body */}
      <View style={styles.body}>
        {/* Date chip — read-only display of the day being logged (#96) */}
        <View style={styles.dateChip}>
          <Icon name="calendar" size={15} color={colors.primary} />
          <Text style={styles.dateChipText}>{formatDateChip(date)}</Text>
        </View>

        {/* Section heading */}
        <Text style={styles.heading}>Wie fühlst du dich?</Text>

        {/* 2-column mood grid with colored dots + filled selected state (#97) */}
        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
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

      {/* Pinned CTA at the bottom (#95) */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            isBusy && styles.ctaDisabled,
          ]}
          onPress={submit}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.ctaText}>Speichern</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/** Reads the stored mood for a day, or null when nothing is logged for it. */
async function loadMoodForDate(date: string): Promise<Mood | null> {
  const row = await getDailyLog(date);
  return row ? parseMood(row.mood) : null;
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/** Splits a flat options array into rows of two for the 2-column grid. */
function pairOptions<T>(options: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < options.length; i += 2) {
    rows.push(options.slice(i, i + 2));
  }
  return rows;
}

/**
 * Formats an ISO date as a German date chip label, e.g. "Heute, 19. Juni".
 * Falls back to the raw string when the date is not valid.
 */
function formatDateChip(isoDate: string): string {
  if (!isValidIso(isoDate)) return isoDate;
  const today = todayIso();
  const parts = isoDate.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const DE_MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  const monthName = DE_MONTHS[month - 1] ?? '';
  const dayLabel = isoDate === today ? 'Heute' : `${day}. ${monthName} ${year}`;
  return isoDate === today ? `Heute, ${day}. ${monthName}` : dayLabel;
}

const CHIP_BG = '#241F2E';
const CHIP_BORDER = '#322B3D';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },

  // Header (#95)
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
    borderRadius: radii.sm + 2, // 12px as per design
    backgroundColor: CHIP_BG,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { opacity: 0.7 },
  title: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  headerSpacer: { width: 38, height: 38 },

  // Scrollable body
  body: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    gap: 18,
  },

  // Date chip (#96)
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CHIP_BG,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dateChipText: {
    ...typography.label,
    color: colors.label,
  },

  // Heading
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.02 * 24,
    color: colors.text,
  },

  // Mood grid (#97)
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
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
  gridCellSelected: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  gridCellPressed: { opacity: 0.7 },
  dot: {
    width: 11,
    height: 11,
    borderRadius: radii.pill,
    flexShrink: 0,
  },
  cellText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 18,
    color: '#D7D1DC',
    flexShrink: 1,
  },
  cellTextSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.onPrimary,
  },

  error: { color: colors.danger, fontSize: 14 },

  // Pinned CTA (#95)
  ctaContainer: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 30,
    paddingTop: 16,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontFamily: fonts.bodySemiBold },
});
