// Flower · Home (docs/design.md, spec-flower-experience.md) — rebuilt for
// issues #76–#80. Renders the warm header (#80), then the section order the
// design specifies: phase/backfill card → 'Periode eintragen' CTA → 'Diese
// Woche' week glance → inline mood row. Prediction is consumed via
// useFlowerPrediction; mood and period data are loaded on focus to power
// week-glance dots and the mood chip selection.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PhaseChip } from '../../components/PhaseChip';
import { PhaseTrack } from '../../components/PhaseTrack';
import { WeekGlance } from '../../components/WeekGlance';
import { MoodRow } from '../../components/MoodRow';
import { useAuth } from '../auth/AuthProvider';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { getOwnProfile } from '../../lib/data/profiles';
import { getDailyLog, listDailyLogs, listPeriods, upsertDailyLog, type Mood } from '../../lib/data';
import type { DateRange, Prediction } from '../../lib/prediction';
import { daysBetween } from '../../lib/prediction/dates';
import { formatIso } from '../cycle-logging/date';
import { useFlowerPrediction } from './useFlowerPrediction';
import type { FlowerPrediction } from './prediction';
import { loggedDays } from './calendar';
import { parseMood } from './mood';
import {
  backfillCounter,
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

/** Primary "Periode eintragen" CTA: SVG plus glyph + label, gap 10 (design). */
function LogCta({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Icon name="plus" size={20} color={colors.onPrimary} />
      <Text style={styles.ctaText}>Periode eintragen</Text>
    </Pressable>
  );
}

function BackfillCard({ loggedCount }: { loggedCount: number }) {
  return (
    <View style={styles.phaseCard}>
      <View style={styles.chipRow}>
        <View style={styles.counterChip}>
          <Text style={styles.counterChipLabel}>Noch keine Daten</Text>
        </View>
        <Text style={styles.cycleDayLabel}>{backfillCounter(loggedCount)}</Text>
      </View>
      <Text style={styles.displayHeadline}>Bald geht{'’'}s los</Text>
      <Text style={styles.bodyMuted}>
        Trag mindestens 3 Perioden ein, damit Flowmate Phase und fruchtbares
        Fenster vorhersagen kann.
      </Text>
      <PredictionDisclaimer />
    </View>
  );
}

/** Fertile window as a single inline row: dot + label + date (design). */
function FertileWindow({ window, approx }: { window: DateRange | null; approx: string }) {
  if (window === null) return null;
  return (
    <View style={styles.fertileRow}>
      <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
      <Text style={styles.fertileLabel}>Fruchtbares Fenster</Text>
      <Text style={styles.fertileValue}>
        {approx}
        {formatIso(window.start)} – {formatIso(window.end)}
      </Text>
    </View>
  );
}

/** Low-confidence caveat rendered as a bordered warning banner with an icon. */
function LowConfidenceBanner({ text }: { text: string }) {
  return (
    <View style={styles.caveatBanner}>
      <Icon name="warning" size={18} color={colors.secondary} />
      <Text style={styles.caveatText}>{text}</Text>
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
  // Uses daysBetween directly (semantically clear: "days from start to today").
  // Falls back to 1 when cycleStart is unknown.
  const cycleDay = cycleStart ? Math.max(1, daysBetween(cycleStart, today) + 1) : 1;
  return (
    <View style={styles.phaseCard}>
      <View style={styles.chipRow}>
        <PhaseChip phase={prediction.currentPhase} label={phaseLabel(prediction.currentPhase)} />
        <Text style={styles.cycleDayLabel}>Zyklustag {cycleDay}</Text>
      </View>
      <Text style={styles.displayHeadline}>{`${approx}${periodHeadline(days)}`}</Text>
      <Text style={styles.reassurance}>{reassuranceLine(prediction.confidence)}</Text>
      <PhaseTrack currentPhase={prediction.currentPhase} />
      <FertileWindow window={prediction.fertileWindow} approx={approx} />
      {caveat ? <LowConfidenceBanner text={caveat} /> : null}
      <PredictionDisclaimer />
    </View>
  );
}

type SectionProps = {
  data: FlowerPrediction | null;
  isLoading: boolean;
  error: Error | null;
  cycleStart: string | null;
  periodCount: number;
};

function PredictionSection({ data, isLoading, error, cycleStart, periodCount }: SectionProps) {
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
        <Text style={styles.cardTitle}>Prognose nicht verfügbar</Text>
        <Text style={styles.bodyMuted}>Bitte später erneut versuchen.</Text>
      </View>
    );
  }
  if (isInsufficient(data) || data.prediction === null) {
    return <BackfillCard loggedCount={periodCount} />;
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
  const [periodCount, setPeriodCount] = useState(0);

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
      // parseMood narrows the DB string to the curated Mood union safely.
      void getDailyLog(today).then((log) =>
        setSelectedMood(log?.mood != null ? parseMood(log.mood) : null),
      );
      void listDailyLogs().then((logs) => setMoodDates(new Set(logs.map((l) => l.date))));
      void listPeriods().then((periods) => {
        setPeriodDates(loggedDays(periods));
        setPeriodCount(periods.length);
        // Most recent period start for cycle-day calculation in the phase card.
        const sorted = [...periods].sort((a, b) => b.start_date.localeCompare(a.start_date));
        setCycleStart(sorted[0]?.start_date ?? null);
      });
    }, [session?.user.id, today]),
  );

  const weekDays = buildWeekDays(today, periodDates, moodDates);

  // Optimistic update: set immediately, then persist. The .catch surfaces the
  // rejection to the global unhandled-promise boundary (LogBox in dev). A full
  // error UI path is deferred until error-state spec work in a future phase.
  function handleMoodSelect(mood: Mood) {
    setSelectedMood(mood);
    upsertDailyLog({ date: today, mood }).catch((cause: unknown) => {
      // Revert optimistic selection so the UI is not stuck in the wrong state.
      setSelectedMood(null);
      throw cause;
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greetingLabel}>{greeting(hour)}</Text>
            <Text style={styles.nameLabel}>{displayName ?? email ?? 'Flowmate'}</Text>
          </View>
          <Avatar displayName={displayName} fallback={email} size={42} />
        </View>

        <PredictionSection
          data={data}
          isLoading={isLoading}
          error={error}
          cycleStart={cycleStart}
          periodCount={periodCount}
        />

        <LogCta onPress={() => router.push('/period-form')} />

        <WeekGlance days={weekDays} onCalendar={() => router.push('/calendar')} />

        <MoodRow
          selectedMood={selectedMood}
          onSelect={handleMoodSelect}
          onOpenDetail={() => router.push('/mood-log')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 20 },
  header: { paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { gap: 2 },
  greetingLabel: { ...typography.bodySm, color: colors.textMuted },
  // Greeting name: DM Sans 600 24/30 per the artboard (between H2 22 and H1 34).
  nameLabel: { ...typography.h2, fontSize: 24, lineHeight: 30, color: colors.text },
  // Generic container for the loading / error states (no design-specific tokens).
  card: { backgroundColor: colors.surface, borderColor: colors.hairline, borderWidth: 1, borderRadius: radii.lg, padding: 22, gap: 14 },
  // Phase / backfill card: border-radius 26, internal gap 18 (design); the
  // border uses colors.hairline (#2F2839) per the card-border token.
  phaseCard: { backgroundColor: colors.surface, borderColor: colors.hairline, borderWidth: 1, borderRadius: 26, padding: 22, gap: 18 },
  cardTitle: { ...typography.title, color: colors.text },
  bodyMuted: { ...typography.bodySm, color: colors.textMuted },
  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cycleDayLabel: { ...typography.label, color: colors.textMuted },
  // Backfill counter pill ("Noch keine Daten") — default chip surface + border.
  counterChip: { alignSelf: 'flex-start', backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 12 },
  counterChipLabel: { ...typography.label, color: colors.textMuted },
  // Phase-card headline: H1 (DM Sans 600 ~34/36), not Display (40) — per design.
  displayHeadline: { ...typography.h1, color: colors.text },
  reassurance: { ...typography.bodySm, color: colors.textMuted },
  // Low-confidence caveat: bordered warning banner with icon (design).
  caveatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2A2330', // warning-banner surface (design)
    borderColor: '#3A3240', // warning-banner border (design)
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  caveatText: { ...typography.bodySm, color: colors.secondary, flex: 1 },
  // Fertile window: one inline row — dot + label + date.
  fertileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
  fertileLabel: { ...typography.label, color: colors.secondary },
  fertileValue: { ...typography.bodySm, color: colors.text },
  // Primary CTA: row layout for the plus glyph + label (gap 10, design).
  cta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: 15, padding: 17 },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { ...typography.title, color: colors.onPrimary },
});
