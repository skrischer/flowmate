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

import { DISCLAIMER_TEXT } from '../../components/PredictionDisclaimer';
import { getPartnerProfile } from '../../lib/data';
import type { PartnerProfile } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { isAttunementEmpty, type MateAttunement } from './attunement-view';
import { AttunementCard } from './AttunementCard';
import { EndedView } from './EndedView';
import { PhaseTrackSection } from './PhaseTrackSection';
import { useMateAttunement } from './useMateAttunement';

export function MateAttunementScreen() {
  const { data, connected, isLoading, error } = useMateAttunement();
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    getPartnerProfile()
      .then((profile) => setPartnerProfile(profile))
      .catch(() => setPartnerProfile(null));
  }, []);

  const flowerName = partnerProfile?.displayName ?? null;
  // "Getrennt" means the pairing was revoked -- not a transient load error and
  // not a connected edge still waiting for the first snapshot. Only show the
  // ended badge when the load settled cleanly with no active edge.
  const isEnded = !isLoading && error === null && !connected;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header flowerName={flowerName} isEnded={isEnded} />
        <AttunementSection
          data={data}
          connected={connected}
          isLoading={isLoading}
          error={error}
          flowerName={flowerName}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Header: eyebrow + Flower name + connection badge (#107). When ended, the
// eyebrow reads "Zuletzt eingestimmt auf" — the pairing is over, not active.
function Header({ flowerName, isEnded }: { flowerName: string | null; isEnded: boolean }) {
  const eyebrow = headerEyebrow(flowerName, isEnded);
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{flowerName ?? 'Flowmate'}</Text>
        </View>
        <ConnectionBadge isEnded={isEnded} />
      </View>
    </View>
  );
}

function headerEyebrow(flowerName: string | null, isEnded: boolean): string {
  if (flowerName === null) {
    return 'Eingestimmt';
  }
  return isEnded ? 'Zuletzt eingestimmt auf' : 'Eingestimmt auf';
}

// Pill badge: sage "Verbunden" (with a green status dot) when connected, muted
// "Getrennt" when ended.
function ConnectionBadge({ isEnded }: { isEnded: boolean }) {
  return (
    <View style={[styles.badge, isEnded ? styles.badgeEnded : styles.badgeConnected]}>
      {isEnded ? null : <View style={styles.badgeDot} />}
      <Text style={[styles.badgeText, isEnded ? styles.badgeTextEnded : styles.badgeTextConnected]}>
        {isEnded ? 'Getrennt' : 'Verbunden'}
      </Text>
    </View>
  );
}

type SectionProps = {
  data: MateAttunement | null;
  connected: boolean;
  isLoading: boolean;
  error: Error | null;
  flowerName: string | null;
};

// Picks the right surface for the current load / connection state.
function AttunementSection({ data, connected, isLoading, error, flowerName }: SectionProps) {
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
        <Text style={styles.errorTitle}>Gerade nicht verfügbar</Text>
        <Text style={styles.bodyMuted}>Bitte später erneut versuchen.</Text>
      </View>
    );
  }
  if (!connected) {
    return <EndedView flowerName={flowerName} />;
  }
  if (data === null || isAttunementEmpty(data)) {
    return <WaitingCard flowerName={flowerName} />;
  }
  return (
    <>
      <View style={styles.cards}>
        <AttunementCard data={data} flowerName={flowerName} />
        {data.phase !== null ? (
          <PhaseTrackSection phase={data.phase} flowerName={flowerName} />
        ) : null}
      </View>
      <BottomDisclaimer flowerName={flowerName} />
    </>
  );
}

// Mandatory "Prognose, keine Garantie" disclaimer (constitution) — relocated to
// the very bottom of the screen with the Paper artboard's longer copy (#135).
function BottomDisclaimer({ flowerName }: { flowerName: string | null }) {
  const name = flowerName ?? 'Deine Flower';
  return (
    <View style={styles.disclaimer}>
      <View style={styles.disclaimerMark}>
        <Text style={styles.disclaimerMarkText}>i</Text>
      </View>
      <Text style={styles.disclaimerText}>
        {`${DISCLAIMER_TEXT} ${name} teilt nur, was sie möchte.`}
      </Text>
    </View>
  );
}

// Connected but the owner has not shared anything yet: a calm waiting state.
// Stays under the "Verbunden" badge -- this is not the ended view.
function WaitingCard({ flowerName }: { flowerName: string | null }) {
  return (
    <View style={styles.waitingCard}>
      <Text style={styles.waitingTitle}>Noch keine Daten</Text>
      <Text style={styles.bodyMuted}>
        {`${flowerName ?? 'Deine Flower'} hat noch nichts geteilt. Sobald etwas da ist, erscheint es hier.`}
      </Text>
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
  // Eyebrow "Eingestimmt auf": Inter 400 13/16 per the artboard (not bodySm 14/20).
  eyebrow: { ...typography.bodySm, fontSize: 13, lineHeight: 16, color: colors.textMuted },
  // Flower-name title: DM Sans 600 24/30 per the artboard (not H1 34).
  title: { ...typography.h2, fontSize: 24, lineHeight: 30, color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
  badgeConnected: { backgroundColor: colors.successSurface },
  // Getrennt badge surface — the muted #241F2E per the artboard (design.md
  // Surfaces · Mate · Eingestimmt beendet), distinct from the sage Verbunden.
  badgeEnded: { backgroundColor: colors.inputDisabled },
  badgeText: { ...typography.caption },
  badgeTextConnected: { color: colors.successText },
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
  waitingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    gap: 8,
  },
  waitingTitle: { ...typography.title, color: colors.text },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disclaimerMark: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerMarkText: { color: colors.textSubtle, fontSize: 11, fontWeight: '600' },
  disclaimerText: { color: colors.textSubtle, fontSize: 12, lineHeight: 16, flex: 1 },
});
