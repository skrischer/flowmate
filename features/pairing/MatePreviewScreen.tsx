// Flower · "Was mein Mate sieht" (spec-pairing.md, #156): a read-only preview of
// the phase-level fields the Mate sees via shared_state — never raw logs, moods,
// or exact dates (constitution). Reuses TransparencyCard and fetches the Mate's
// display name for the heading. Reached from the Profil tab; distinct from
// "Mein Mate" (/pairing), which manages and revokes the pairing.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { getPartnerProfile, type PartnerProfile } from '../../lib/data';
import { colors, spacing } from '../../lib/theme';
import { TransparencyCard } from './TransparencyCard';

export function MatePreviewScreen() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);

  // Reload on focus so a fresh pairing's name shows; the heading falls back to
  // "dein Mate" if the profile read fails (non-fatal — no raw data here anyway).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPartnerProfile()
        .then((p) => {
          if (active) setPartner(p);
        })
        .catch(() => {
          // non-fatal: TransparencyCard falls back to "dein Mate"
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TransparencyCard mateName={partner?.displayName ?? null} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen },
});
