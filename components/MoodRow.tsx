// Inline mood prompt row for the Flower home (#78).
// Shows 6 mood chips; tapping one logs immediately via upsertDailyLog.
// The selected chip is filled with primary lavender; others are surface-raised.
// Mood-only by design (constitution / vision non-goal: no free-text, no symptoms).
// Mood is logged inline-for-today here only — there is no standalone screen.
// Mood set sourced from features/flower/mood.ts (shared constant).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '../lib/theme';
import { MOOD_OPTIONS } from '../features/flower/mood';
import type { Mood } from '../lib/data';

export interface MoodRowProps {
  /** Currently selected mood for today, or null if none logged yet. */
  selectedMood: Mood | null;
  /** Called when the user taps a mood chip. */
  onSelect: (mood: Mood) => void;
}

/** Horizontal 6-chip mood row with "Wie fuehlst du dich heute?" heading. */
export function MoodRow({ selectedMood, onSelect }: MoodRowProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Wie fühlst du dich heute?</Text>
      <View style={styles.chips}>
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = opt.value === selectedMood;
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No raised surface: per design only the prediction card is a raised card; the
  // mood row sits on the base background (#151).
  card: {
    gap: 14,
  },
  heading: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Default chip: #241F2E (inputDisabled) + #322B3D (chipBorder) per design.md.
  chip: {
    backgroundColor: colors.inputDisabled,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  // Selected: primary fill, on-primary text; transparent border keeps box sizing.
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  chipLabelSelected: {
    color: colors.onPrimary,
  },
});
