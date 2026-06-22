// Flower · Mood-Logging (docs/design.md, spec-flower-experience.md): log or
// update today's (or a past day's) mood from the curated set of 6. Mood-only by
// design — no free-text note, no symptoms (vision non-goal: no quantified-self
// tracker). All persistence runs through lib/data's daily_logs CRUD; this
// component makes no direct Supabase calls. Not a prediction surface, so no
// "Prognose"-disclaimer is rendered here.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getDailyLog, upsertDailyLog, type Mood } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';
import { formatIso, isValidIso } from '../cycle-logging/date';
import { todayIso } from './today';
import { MOOD_OPTIONS, parseMood } from './mood';

export function MoodLogScreen() {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
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

  // Reload the stored mood whenever the user edits the date to a valid day, so
  // backfilling a past date reflects what is already saved for it.
  const onDateChange = (next: string) => {
    setDate(next);
    setError(null);
    if (!isValidIso(next)) {
      setMood(null);
      return;
    }
    loadMoodForDate(next)
      .then(setMood)
      .catch((cause: unknown) => setError(messageOf(cause, 'Laden fehlgeschlagen.')));
  };

  const submit = async () => {
    if (!isValidIso(date)) {
      setError('Bitte ein gueltiges Datum eingeben (JJJJ-MM-TT).');
      return;
    }
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tag</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={onDateChange}
            placeholder="JJJJ-MM-TT"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            editable={!isBusy}
          />
          <Text style={styles.hint}>
            {isValidIso(date)
              ? `Stimmung fuer ${formatIso(date)}. Auch vergangene Tage moeglich.`
              : 'Auch vergangene Tage moeglich (nachtragen).'}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Stimmung</Text>
          <View style={styles.chips}>
            {MOOD_OPTIONS.map((option) => {
              const selected = option.value === mood;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => setMood(option.value)}
                  disabled={isBusy}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
      </ScrollView>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  content: { padding: spacing.screen, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { color: colors.label, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    color: colors.text,
    fontSize: 15,
  },
  hint: { color: colors.textSubtle, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { color: colors.label, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.text },
  error: { color: colors.danger, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
