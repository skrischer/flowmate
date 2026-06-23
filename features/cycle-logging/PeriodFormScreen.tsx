// Flower · Periode eintragen (docs/design.md, spec-cycle-logging.md): the
// log/edit sheet. Presented as a modal sheet (headerShown: false on the route).
// Create a new period or edit an existing one (by `id` param),
// with a past-date-capable start, an optional end, and delete when editing.
// All persistence goes through lib/data; no direct Supabase calls here.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Icon } from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { DatePickerField } from './DatePickerField';
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
      return 'Bitte ein gueltiges Startdatum eingeben.';
    }
    const trimmedEnd = endDate.trim();
    if (trimmedEnd && !isValidIso(trimmedEnd)) {
      return 'Bitte ein gueltiges Enddatum eingeben.';
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
      // edges={['bottom']}: modal sheet — top inset already handled by the OS chrome.
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    // edges={['bottom']}: modal sheet — OS chrome covers the top; only footer needs inset.
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      {/* Sheet header: close-X + centered title (no stack back arrow) */}
      <View style={styles.sheetHeader}>
        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={() => router.back()}
          accessibilityLabel="Schliessen"
          hitSlop={10}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.sheetTitle}>
          {isEdit ? 'Periode bearbeiten' : 'Periode eintragen'}
        </Text>
        {/* Spacer keeps title visually centered */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Intro line */}
      <Text style={styles.intro}>
        {isEdit
          ? 'Passe den Zeitraum dieser Periode an oder loesche den Eintrag.'
          : 'Trag den Beginn deiner Periode ein. Das Enddatum ist optional.'}
      </Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.fields}
        keyboardShouldPersistTaps="handled"
      >
        <DatePickerField
          label="Startdatum"
          value={startDate}
          onChange={setStartDate}
          disabled={isBusy}
          hint="Auch vergangene Tage moeglich (Historie nachtragen)."
        />

        <DatePickerField
          label="Enddatum (optional)"
          value={endDate}
          onChange={setEndDate}
          optional
          minDate={startDate || undefined}
          disabled={isBusy}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Delete button — edit case only */}
        {isEdit ? (
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
            onPress={remove}
            disabled={isBusy}
          >
            <Icon name="trash" size={18} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Periode loeschen</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Pinned save CTA */}
      <View style={styles.footer}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Sheet header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
  },
  closeBtnPressed: { opacity: 0.7 },
  sheetTitle: {
    ...typography.title,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },

  // Intro line
  intro: {
    ...typography.bodySm,
    color: colors.textMuted,
    paddingHorizontal: spacing.screen,
    paddingBottom: 8,
  },

  // Scrollable field area
  scrollArea: { flex: 1 },
  fields: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  error: { color: colors.danger, fontSize: 14 },

  // Delete (edit-only)
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 17,
    marginTop: 8,
  },
  deleteBtnPressed: { opacity: 0.7 },
  deleteBtnText: { color: colors.danger, fontSize: 16, fontWeight: '600' },

  // Pinned footer + CTA
  footer: {
    paddingHorizontal: spacing.screen,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
