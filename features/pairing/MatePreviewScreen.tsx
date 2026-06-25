// Flower · "Was mein Mate sieht" (spec-pairing.md, #156; spec-design-reconciliation
// F1): a read-only preview of the phase-level fields the Mate sees via shared_state
// — never raw logs, moods, or exact dates (constitution). Reuses TransparencyCard
// and fetches the Mate's display name for the heading. Reached from the Profil tab
// and from Pairing-Management; distinct from "Mein Mate" (/pairing), which manages
// and revokes the pairing.
//
// Layout (findings: /mate-preview had no design and rendered ~60% empty):
//   shared TopBar + intro lede + the TransparencyCard, or a defined empty state
//   when no Mate is paired (previously a silent "dein Mate" fallback).
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';

import { getPartnerProfile, listActivePairings, type PartnerProfile } from '../../lib/data';
import { colors, spacing, typography } from '../../lib/theme';
import { Icon } from '../../components/Icon';
import { TopBar } from '../../components/TopBar';
import { TransparencyCard } from './TransparencyCard';

// null = still loading; the resolved view distinguishes paired from unpaired so
// the empty state is shown only when there is genuinely no active Mate edge —
// getPartnerProfile alone returns null both when unpaired and when the partner
// has no display name yet, so the edge count is the authoritative paired signal.
interface PreviewState {
  paired: boolean;
  partner: PartnerProfile | null;
}

export function MatePreviewScreen() {
  const [state, setState] = useState<PreviewState | null>(null);

  // Reload on focus so a fresh pairing reflects immediately. A failed read falls
  // back to the unpaired view — non-fatal, no raw data lives on this screen.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listActivePairings(), getPartnerProfile()])
        .then(([pairings, partner]) => {
          if (active) setState({ paired: pairings.length > 0, partner });
        })
        .catch(() => {
          if (active) setState({ paired: false, partner: null });
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar title="Was mein Mate sieht" />
      <ScrollView contentContainerStyle={styles.content}>
        {state === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : state.paired ? (
          <>
            <Text style={styles.lede}>
              Diese Einstimmung teilst du gerade — nur Phase und sanfte Hinweise,
              nie deine Einträge.
            </Text>
            <TransparencyCard mateName={state.partner?.displayName ?? null} />
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </View>
  );
}

// No active Mate edge: there is no one to preview for, so explain what would be
// shared once a Mate is connected instead of falling back to a generic card.
function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="eyeOff" size={26} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Noch kein Mate verbunden</Text>
      <Text style={styles.emptyBody}>
        Sobald ein Mate verbunden ist, siehst du hier genau, was er sieht — nur
        Phase und sanfte Hinweise, nie deine Einträge.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 18, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lede: { ...typography.body, color: colors.textMuted },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: spacing.screen,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
