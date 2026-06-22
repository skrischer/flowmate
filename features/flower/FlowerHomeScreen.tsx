// Flower · Home (docs/design.md, spec-flower-experience.md): the Flower's hub.
// Renders the current phase, the next-period countdown, and the fertile window
// from the prediction view-model, with the mandatory disclaimer on every
// prediction surface. Handles all confidence states: `none` withholds the window
// and shows a backfill prompt; `low` adds a visible low-confidence caveat;
// `medium`/`high` render normally. Prediction is consumed via useFlowerPrediction
// (lib/prediction behind lib/data) and never reimplemented here.
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
import { useAuth } from '../auth/AuthProvider';
import { colors, radii, spacing } from '../../lib/theme';
import type { DateRange, Prediction } from '../../lib/prediction';
import { formatIso } from '../cycle-logging/date';
import { useFlowerPrediction } from './useFlowerPrediction';
import type { FlowerPrediction } from './prediction';
import {
  confidenceCaveat,
  daysToNextPeriod,
  isInsufficient,
  nextPeriodLabel,
  phaseLabel,
} from './home-view';

export function FlowerHomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data, isLoading, error } = useFlowerPrediction();
  const greeting = session?.user.email ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Heute</Text>
          <Text style={styles.title}>Flowmate</Text>
          {greeting ? <Text style={styles.subtitle}>{greeting}</Text> : null}
        </View>

        <PredictionSection data={data} isLoading={isLoading} error={error} router={router} />

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.push('/period-form')}
        >
          <Text style={styles.ctaText}>Periode eintragen</Text>
        </Pressable>

        <View style={styles.navGroup}>
          <NavRow label="Kalender" onPress={() => router.push('/calendar')} />
          <NavRow label="Zyklus-Historie" onPress={() => router.push('/periods')} />
          <NavRow label="Stimmung eintragen" onPress={() => router.push('/mood-log')} />
          <NavRow label="Mate einladen" onPress={() => router.push('/invite')} />
          <NavRow label="Profil" onPress={() => router.push('/profile')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionProps = {
  data: FlowerPrediction | null;
  isLoading: boolean;
  error: Error | null;
  router: ReturnType<typeof useRouter>;
};

// Picks the right prediction surface for the current load/confidence state.
function PredictionSection({ data, isLoading, error, router }: SectionProps) {
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
  return <PhaseCard prediction={data.prediction} today={data.today} />;
}

// Insufficient-data state (`confidence: none`): no fabricated window, a prompt to
// log more cycles, and the disclaimer (this is still a prediction surface).
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

// The full phase card for `low`/`medium`/`high`: phase, next-period countdown,
// fertile window, the low-confidence caveat when present, and the disclaimer.
function PhaseCard({ prediction, today }: { prediction: Prediction; today: string }) {
  const days = daysToNextPeriod(today, prediction.nextPeriodDate);
  const caveat = confidenceCaveat(prediction.confidence);
  const approx = prediction.confidence === 'low' ? '~ ' : '';
  return (
    <View style={styles.card}>
      <Text style={styles.phaseLabel}>Aktuelle Phase</Text>
      <Text style={styles.phaseName}>{phaseLabel(prediction.currentPhase)}</Text>

      <View style={styles.statRow}>
        <Stat label="Naechste Periode" value={`${approx}${nextPeriodLabel(days)}`} />
        <Stat label="Am" value={formatIso(prediction.nextPeriodDate)} />
      </View>

      <FertileWindow window={prediction.fertileWindow} approx={approx} />

      {caveat ? <Text style={styles.caveat}>{caveat}</Text> : null}
      <PredictionDisclaimer />
    </View>
  );
}

// The fertile window range, or a withheld note when the engine returns null.
function FertileWindow({ window, approx }: { window: DateRange | null; approx: string }) {
  if (window === null) {
    return null;
  }
  return (
    <View style={styles.fertile}>
      <Text style={styles.fertileLabel}>Fruchtbares Fenster</Text>
      <Text style={styles.fertileValue}>
        {approx}
        {formatIso(window.start)} bis {formatIso(window.end)}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={styles.rowText}>{label}</Text>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 18 },
  header: { paddingTop: 8, gap: 2 },
  eyebrow: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 30, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    gap: 14,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  bodyMuted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  phaseLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  phaseName: { color: colors.text, fontSize: 26, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 24 },
  stat: { gap: 4 },
  statLabel: { color: colors.textSubtle, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '600' },
  fertile: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    gap: 4,
  },
  fertileLabel: { color: colors.secondary, fontSize: 12, fontWeight: '600' },
  fertileValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  caveat: { color: colors.secondary, fontSize: 13, lineHeight: 18 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  inlineCta: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  navGroup: { gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 18,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: colors.textSubtle, fontSize: 16 },
});
