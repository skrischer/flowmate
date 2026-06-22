// Flower · Periode eintragen (docs/design.md, spec-cycle-logging.md): the
// log/edit sheet. Create a new period or edit an existing one (by `id` param),
// with a past-date-capable start, an optional end, and delete when editing.
// All persistence goes through lib/data; no direct Supabase calls here.
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
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  createPeriod,
  deletePeriod,
  listPeriods,
  updatePeriod,
} from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';
import { isOnOrAfter, isValidIso, todayIso } from './date';

export function PeriodFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = typeof id === 'string' && id.length > 0;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // On open, prefill: an existing row when editing (fetched via lib/data), else
  // today's date as the start for a fresh log.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!isEdit) {
        setStartDate(todayIso());
        setEndDate('');
        setIsLoaded(true);
        return;
      }
      listPeriods()
        .then((rows) => {
          if (!active) return;
          const row = rows.find((p) => p.id === id);
          setStartDate(row?.start_date ?? todayIso());
          setEndDate(row?.end_date ?? '');
          setIsLoaded(true);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
          setIsLoaded(true);
        });
      return () => {
        active = false;
      };
    }, [id, isEdit]),
  );

  const validate = (): string | null => {
    if (!isValidIso(startDate)) {
      return 'Bitte ein gueltiges Startdatum eingeben (JJJJ-MM-TT).';
    }
    const trimmedEnd = endDate.trim();
    if (trimmedEnd && !isValidIso(trimmedEnd)) {
      return 'Bitte ein gueltiges Enddatum eingeben (JJJJ-MM-TT).';
    }
    if (trimmedEnd && !isOnOrAfter(startDate, trimmedEnd)) {
      return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
    }
    return null;
  };

  const submit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setIsBusy(true);
    const end = endDate.trim() ? endDate.trim() : null;
    try {
      if (isEdit) {
        await updatePeriod(id, { start_date: startDate, end_date: end });
      } else {
        await createPeriod({ start_date: startDate, end_date: end });
      }
      router.back();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
      setIsBusy(false);
    }
  };

  const remove = async () => {
    if (!isEdit) return;
    setError(null);
    setIsBusy(true);
    try {
      await deletePeriod(id);
      router.back();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Loeschen fehlgeschlagen.');
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
          <Text style={styles.label}>Startdatum</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="JJJJ-MM-TT"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            editable={!isBusy}
          />
          <Text style={styles.hint}>
            Auch vergangene Tage moeglich (Historie nachtragen).
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Enddatum (optional)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="JJJJ-MM-TT"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            editable={!isBusy}
          />
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
            <Text style={styles.ctaText}>{isEdit ? 'Aenderungen speichern' : 'Eintragen'}</Text>
          )}
        </Pressable>

        {isEdit ? (
          <Pressable
            style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
            onPress={remove}
            disabled={isBusy}
          >
            <Text style={styles.deleteText}>Loeschen</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  delete: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 17,
    alignItems: 'center',
  },
  deletePressed: { opacity: 0.7 },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
