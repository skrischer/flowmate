// Flower · Periode eintragen (docs/design.md, spec-cycle-logging.md,
// spec-period-range-picker.md): the log/edit sheet. Presented as a modal sheet
// (headerShown: false on the route). Create a new period or edit an existing one
// (by `id` param) through a SINGLE range picker (start + optional end over one
// month calendar) — a past-date-capable start, an open end ("läuft noch") as the
// default resting state, and delete when editing. All persistence goes through
// lib/data; no direct Supabase calls here.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
  refreshSharedState,
  updatePeriod,
} from '../../lib/data';
import { Icon } from '../../components/Icon';
import { colors } from '../../lib/theme';
import { DateRangeField } from './DateRangeField';
import { isOnOrAfter, isValidIso, todayIso } from './date';
import { styles } from './PeriodFormScreen.styles';

export function PeriodFormScreen() {
  const router = useRouter();
  const { id, startDate: paramStartDate } = useLocalSearchParams<{
    id?: string;
    startDate?: string;
  }>();
  const isEdit = typeof id === 'string' && id.length > 0;

  const [startDate, setStartDate] = useState('');
  // null end = open period ("läuft noch") — the default resting state.
  const [endDate, setEndDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // On open, prefill: an existing row when editing (fetched via lib/data), else
  // today's date as the start for a fresh log.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!isEdit) {
        // Prefill the tapped calendar day when navigated from the calendar
        // (validated); otherwise default to today (e.g. the home/CTA path).
        setStartDate(
          paramStartDate && isValidIso(paramStartDate) ? paramStartDate : todayIso(),
        );
        setEndDate(null);
        setIsLoaded(true);
        return;
      }
      listPeriods()
        .then((rows) => {
          if (!active) return;
          const row = rows.find((p) => p.id === id);
          setStartDate(row?.start_date ?? todayIso());
          setEndDate(row?.end_date ?? null);
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
    }, [id, isEdit, paramStartDate]),
  );

  const validate = (): string | null => {
    if (!isValidIso(startDate)) {
      return 'Bitte ein gültiges Startdatum eingeben.';
    }
    if (endDate !== null) {
      if (!isValidIso(endDate)) {
        return 'Bitte ein gültiges Enddatum eingeben.';
      }
      if (!isOnOrAfter(startDate, endDate)) {
        return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
      }
    }
    return null;
  };

  // Republish the owner's phase snapshot so the paired Mate stays attuned. The
  // period is already saved, so a publish failure is swallowed -- it must not
  // surface as a save error (next app open / log re-derives the snapshot).
  const publishSharedState = () =>
    refreshSharedState(todayIso()).catch(() => undefined);

  const submit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      if (isEdit) {
        await updatePeriod(id, { start_date: startDate, end_date: endDate });
      } else {
        await createPeriod({ start_date: startDate, end_date: endDate });
      }
      await publishSharedState();
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
      await publishSharedState();
      router.back();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Löschen fehlgeschlagen.');
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
          accessibilityLabel="Schließen"
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
          ? 'Passe den Zeitraum dieser Periode an oder lösche den Eintrag.'
          : 'Trag den Beginn deiner Periode ein – auch eine vergangene lässt sich nachtragen.'}
      </Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.fields}
        keyboardShouldPersistTaps="handled"
      >
        <DateRangeField
          label="Zeitraum"
          startValue={startDate}
          endValue={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          hint="Lass das Ende offen, solange die Periode noch läuft."
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
            <Text style={styles.deleteBtnText}>Periode löschen</Text>
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
