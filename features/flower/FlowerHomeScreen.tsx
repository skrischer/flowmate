// Flower · Home (docs/design.md, spec-flower-experience.md) — rebuilt for
// issues #76–#80. Renders the warm header (#80), phase card with chip +
// display headline + reassurance + phase track (#79, #76), 'Diese Woche'
// week glance (#77), 'Periode eintragen' CTA, and the inline mood row (#78).
// Prediction is consumed via useFlowerPrediction; mood and period data are
// loaded on focus to power week-glance dots and the mood chip selection.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
import { Avatar } from '../../components/Avatar';
import { PhaseChip } from '../../components/PhaseChip';
import { PhaseTrack } from '../../components/PhaseTrack';
import { WeekGlance } from '../../components/WeekGlance';
import { MoodRow } from '../../components/MoodRow';
import { useAuth } from '../auth/AuthProvider';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { getOwnProfile } from '../../lib/data/profiles';
import { getDailyLog, listDailyLogs, listPeriods, upsertDailyLog, type Mood } from '../../lib/data';
import type { DateRange, Prediction } from '../../lib/prediction';
import { formatIso } from '../cycle-logging/date';
import { useFlowerPrediction } from './useFlowerPrediction';
import type { FlowerPrediction } from './prediction';
import { loggedDays } from './calendar';
import {
  buildWeekDays,
  confidenceCaveat,
  daysToNextPeriod,
  greeting,
  isInsufficient,
  periodHeadline,
  phaseLabel,
  reassuranceLine,
} from './home-view';
import { todayIso } from './today';

// ── Sub-components ────────────────────────────────────────────────────────────

function BackfillCard({ onLog }: { onLog: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Noch keine Prognose</Text>
      <Text style={styles.bodyMuted}>
        Trage mindestens drei Zyklen ein, damit Flowmate Phase und fruchtbares
        Fenster schaetzen kann.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.inlineCta, pressed && styles.ctaPressed]}
        onPress={onLog}
      >
        <Text style={styles.ctaText}>Zyklen nachtragen</Text>
      </Pressable>
      <PredictionDisclaimer />
    </View>
  );
}

function FertileWindow({ window, approx }: { window: DateRange | null; approx: string }) {
  if (window === null) return null;
  return (
    <View style={styles.fertileBlock}>
      <View style={styles.fertileRow}>
        <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
        <Text style={styles.fertileLabel}>Fruchtbares Fenster</Text>
      </View>
      <Text style={styles.fertileValue}>
        {approx}
        {formatIso(window.start)} – {formatIso(window.end)}
      </Text>
    </View>
  );
}

function PhaseCard({
  prediction,
  today,
  cycleStart,
}: {
  prediction: Prediction;
  today: string;
  cycleStart: string | null;
}) {
  const days = daysToNextPeriod(today, prediction.nextPeriodDate);
  const caveat = confidenceCaveat(prediction.confidence);
  const approx = prediction.confidence === 'low' ? '~ ' : '';
  // Cycle day: days elapsed since the last logged period start + 1 (1-based).
  // Falls back to 1 when cycleStart is unknown.
  const cycleDay = cycleStart ? Math.max(1, daysToNextPeriod(cycleStart, today) + 1) : 1;
  return (
    <View style={styles.card}>
      <View style={styles.chipRow}>
        <PhaseChip phase={prediction.currentPhase} label={phaseLabel(prediction.currentPhase)} />
        <Text style={styles.cycleDayLabel}>Zyklustag {cycleDay}</Text>
      </View>
      <Text style={styles.displayHeadline}>{`${approx}${periodHeadline(days)}`}</Text>
      <Text style={styles.reassurance}>{reassuranceLine(prediction.confidence)}</Text>
      <PhaseTrack currentPhase={prediction.currentPhase} cycleDay={cycleDay} />
      <FertileWindow window={prediction.fertileWindow} approx={approx} />
      {caveat ? <Text style={styles.caveat}>{caveat}</Text> : null}
      <PredictionDisclaimer />
    </View>
  );
}

type SectionProps = {
  data: FlowerPrediction | null;
  isLoading: boolean;
  error: Error | null;
  cycleStart: string | null;
  router: ReturnType<typeof useRouter>;
};

function PredictionSection({ data, isLoading, error, cycleStart, router }: SectionProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prognose nicht verfuegbar</Text>
        <Text style={styles.bodyMuted}>Bitte spaeter erneut versuchen.</Text>
      </View>
    );
  }
  if (isInsufficient(data) || data.prediction === null) {
    return <BackfillCard onLog={() => router.push('/period-form')} />;
  }
  return <PhaseCard prediction={data.prediction} today={data.today} cycleStart={cycleStart} />;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function FlowerHomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data, isLoading, error } = useFlowerPrediction();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [periodDates, setPeriodDates] = useState<ReadonlySet<string>>(new Set());
  const [moodDates, setMoodDates] = useState<ReadonlySet<string>>(new Set());
  const [cycleStart, setCycleStart] = useState<string | null>(null);

  const today = todayIso();
  const hour = new Date().getHours();
  const email = session?.user.email ?? null;

  useFocusEffect(
    useCallback(() => {
      const userId = session?.user.id;
      if (!userId) return;
      void getOwnProfile(userId).then(({ profile }) =>
        setDisplayName(profile?.display_name ?? null),
      );
      void getDailyLog(today).then((log) =>
        setSelectedMood((log?.mood as Mood | undefined) ?? null),
      );
      void listDailyLogs().then((logs) => setMoodDates(new Set(logs.map((l) => l.date))));
      void listPeriods().then((periods) => {
        setPeriodDates(loggedDays(periods));
        // Most recent period start for cycle-day calculation in the phase card.
        const sorted = [...periods].sort((a, b) => b.start_date.localeCompare(a.start_date));
        setCycleStart(sorted[0]?.start_date ?? null);
      });
    }, [session?.user.id, today]),
  );

  const weekDays = buildWeekDays(today, periodDates, moodDates);

  async function handleMoodSelect(mood: Mood) {
    setSelectedMood(mood);
    await upsertDailyLog({ date: today, mood });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greetingLabel}>{greeting(hour)}</Text>
            <Text style={styles.nameLabel}>{displayName ?? email ?? 'Flowmate'}</Text>
          </View>
          <Avatar displayName={displayName} fallback={email} size={44} />
        </View>

        <PredictionSection
          data={data}
          isLoading={isLoading}
          error={error}
          cycleStart={cycleStart}
          router={router}
        />

        <WeekGlance days={weekDays} onCalendar={() => router.push('/calendar')} />

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.push('/period-form')}
        >
          <Text style={styles.ctaText}>Periode eintragen</Text>
        </Pressable>

        <MoodRow selectedMood={selectedMood} onSelect={handleMoodSelect} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 18 },
  header: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { gap: 2 },
  greetingLabel: { ...typography.bodySm, color: colors.textMuted },
  nameLabel: { ...typography.h2, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    gap: 14,
  },
  cardTitle: { ...typography.title, color: colors.text },
  bodyMuted: { ...typography.bodySm, color: colors.textMuted },
  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cycleDayLabel: { ...typography.label, color: colors.textMuted },
  displayHeadline: { ...typography.display, color: colors.text },
  reassurance: { ...typography.bodySm, color: colors.textMuted },
  caveat: { ...typography.bodySm, color: colors.secondary },
  fertileBlock: { gap: 4 },
  fertileRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
  fertileLabel: { ...typography.label, color: colors.secondary },
  fertileValue: { ...typography.bodySm, color: colors.text },
  inlineCta: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { ...typography.title, color: colors.onPrimary },
});
