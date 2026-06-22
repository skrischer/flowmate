// Mate · Eingestimmt (docs/design.md, spec-mate-push.md): the follower's
// READ-ONLY attunement view over the owner's derived `shared_state`. It shows
// the current phase, a discreet next-period heads-up, and a phase-derived
// attunement hint -- NEVER raw data, no calendar, no editing, no write path.
//
// Phase-level information is a prediction, so the mandatory "Prognose, keine
// Garantie." disclaimer is rendered (constitution). After a revoke the follower
// read returns nothing and the ended/empty state ("Verbindung beendet") shows.
// The model is consumed via useMateAttunement (lib/data behind it); nothing is
// recomputed or persisted here.
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PredictionDisclaimer } from '../../components/PredictionDisclaimer';
import { colors, radii, spacing } from '../../lib/theme';
import { isAttunementEmpty, type MateAttunement } from './attunement-view';
import { useMateAttunement } from './useMateAttunement';

export function MateAttunementScreen() {
  const { data, isLoading, error } = useMateAttunement();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Eingestimmt</Text>
          <Text style={styles.title}>Flowmate</Text>
        </View>

        <AttunementSection data={data} isLoading={isLoading} error={error} />
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionProps = {
  data: MateAttunement | null;
  isLoading: boolean;
  error: Error | null;
};

// Picks the right surface for the current load / connection state.
function AttunementSection({ data, isLoading, error }: SectionProps) {
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
        <Text style={styles.cardTitle}>Gerade nicht verfuegbar</Text>
        <Text style={styles.bodyMuted}>Bitte spaeter erneut versuchen.</Text>
      </View>
    );
  }
  if (isAttunementEmpty(data)) {
    return <EndedCard />;
  }
  return <AttunementCard data={data} />;
}

// Revoked / empty state: the pairing ended (or holds nothing shareable yet), so
// no phase data is shown -- only a calm note. No disclaimer here (no prediction).
function EndedCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Verbindung beendet</Text>
      <Text style={styles.bodyMuted}>
        Aktuell folgst du keinem aktiven Zyklus. Sobald dich jemand wieder
        einlaedt, erscheint hier die Phase.
      </Text>
    </View>
  );
}

// The attunement card: phase, the phase-derived hint, the discreet heads-up, and
// the mandatory prediction disclaimer (phase-level data is a prediction).
function AttunementCard({ data }: { data: MateAttunement }) {
  return (
    <View style={styles.card}>
      <Text style={styles.phaseLabel}>Aktuelle Phase</Text>
      <Text style={styles.phaseName}>{data.phaseLabel ?? 'Noch keine Phase'}</Text>

      {data.hint ? <Text style={styles.hint}>{data.hint}</Text> : null}

      {data.headsUp ? (
        <View style={styles.headsUp}>
          <Text style={styles.headsUpLabel}>Heads-up</Text>
          <Text style={styles.headsUpValue}>{data.headsUp}</Text>
        </View>
      ) : null}

      <PredictionDisclaimer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 18 },
  header: { paddingTop: 8, gap: 2 },
  eyebrow: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 30, fontWeight: '600' },
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
  hint: { color: colors.label, fontSize: 15, lineHeight: 22 },
  headsUp: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    gap: 4,
  },
  headsUpLabel: { color: colors.secondary, fontSize: 12, fontWeight: '600' },
  headsUpValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
