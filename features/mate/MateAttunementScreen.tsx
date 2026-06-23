// Mate · Eingestimmt (docs/design.md, spec-mate-push.md): the follower's
// READ-ONLY attunement view over the owner's derived `shared_state`. It shows
// the current phase, a discreet next-period heads-up, and a phase-derived
// attunement hint -- NEVER raw data, no calendar, no editing, no write path.
//
// Header: "Eingestimmt auf [Flower]" + connection badge (issue #107).
// Connected: AttunementCard (PhaseChip + warm headline + heads-up chip, #108) +
//            PhaseTrackSection ("WO [Flower] GERADE IST" + reassurance, #109).
// Ended: centered hero layout with Getrennt badge (issue #110).
// The model is consumed via useMateAttunement (lib/data behind it); nothing is
// recomputed or persisted here.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPartnerProfile } from '../../lib/data';
import type { PartnerProfile } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { isAttunementEmpty, type MateAttunement } from './attunement-view';
import { AttunementCard } from './AttunementCard';
import { EndedView } from './EndedView';
import { PhaseTrackSection } from './PhaseTrackSection';
import { useMateAttunement } from './useMateAttunement';

export function MateAttunementScreen() {
  const { data, isLoading, error } = useMateAttunement();
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    getPartnerProfile()
      .then((profile) => setPartnerProfile(profile))
      .catch(() => setPartnerProfile(null));
  }, []);

  const flowerName = partnerProfile?.displayName ?? null;
  // "Getrennt" means the pairing was revoked -- not a transient load error.
  // Only show the ended badge when the load settled cleanly with no active edge.
  const isEnded = !isLoading && error === null && (data === null || isAttunementEmpty(data));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header flowerName={flowerName} isEnded={isEnded} />
        <AttunementSection data={data} isLoading={isLoading} error={error} flowerName={flowerName} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Header: eyebrow "Eingestimmt auf" + Flower name + connection badge (#107).
function Header({ flowerName, isEnded }: { flowerName: string | null; isEnded: boolean }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          {flowerName !== null ? (
            <Text style={styles.eyebrow}>Eingestimmt auf</Text>
          ) : (
            <Text style={styles.eyebrow}>Eingestimmt</Text>
          )}
          <Text style={styles.title}>{flowerName ?? 'Flowmate'}</Text>
        </View>
        <ConnectionBadge isEnded={isEnded} />
      </View>
    </View>
  );
}

// Pill badge: sage "Verbunden" when connected, muted "Getrennt" when ended.
function ConnectionBadge({ isEnded }: { isEnded: boolean }) {
  return (
    <View style={[styles.badge, isEnded ? styles.badgeEnded : styles.badgeConnected]}>
      <Text style={[styles.badgeText, isEnded ? styles.badgeTextEnded : styles.badgeTextConnected]}>
        {isEnded ? 'Getrennt' : 'Verbunden'}
      </Text>
    </View>
  );
}

type SectionProps = {
  data: MateAttunement | null;
  isLoading: boolean;
  error: Error | null;
  flowerName: string | null;
};

// Picks the right surface for the current load / connection state.
function AttunementSection({ data, isLoading, error, flowerName }: SectionProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error !== null) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Gerade nicht verfuegbar</Text>
        <Text style={styles.bodyMuted}>Bitte spaeter erneut versuchen.</Text>
      </View>
    );
  }
  if (data === null || isAttunementEmpty(data)) {
    return <EndedView flowerName={flowerName} />;
  }
  return (
    <View style={styles.cards}>
      <AttunementCard data={data} flowerName={flowerName} />
      {data.phase !== null ? (
        <PhaseTrackSection phase={data.phase} flowerName={flowerName} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 24 },
  header: { paddingTop: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { gap: 2, flex: 1 },
  eyebrow: { ...typography.bodySm, color: colors.textMuted },
  title: { ...typography.h1, color: colors.text },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeConnected: { backgroundColor: colors.successTint },
  badgeEnded: { backgroundColor: colors.surfaceRaised },
  badgeText: { ...typography.caption },
  badgeTextConnected: { color: colors.success },
  badgeTextEnded: { color: colors.textMuted },
  cards: { gap: 18 },
  loadingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    gap: 8,
  },
  errorTitle: { ...typography.title, color: colors.text },
  bodyMuted: { ...typography.bodySm, color: colors.textMuted },
});
