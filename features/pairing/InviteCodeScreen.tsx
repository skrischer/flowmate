// Flower · Invite-Code (docs/design.md, spec-pairing.md): the owner mints a
// single-use, 24h invite code and shares it out-of-band; the Mate types it on
// the "Code eingeben" screen. The plaintext token exists only in this response
// (the server stores its hash) so it is shown once per generation; regenerating
// mints a fresh code. All access goes through lib/data; no direct Supabase
// calls, no raw health data on this surface.
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createInvite, type Invite } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';

/** Renders an ISO timestamp as a de-DE date + time (e.g. 23.06.2026, 08:15). */
function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InviteCodeScreen() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const generate = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const fresh = await createInvite();
      setInvite(fresh);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : 'Code-Erstellung fehlgeschlagen.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const ctaLabel = invite ? 'Neuen Code generieren' : 'Code generieren';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Mate einladen</Text>
        <Text style={styles.lede}>
          Erzeuge einen Einladungscode und teile ihn mit deinem Mate. Er gibt den
          Code in der App ein, um sich mit dir zu verbinden.
        </Text>
      </View>

      {invite ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Einladungscode</Text>
          <Text style={styles.code} selectable>
            {invite.token}
          </Text>
          <Text style={styles.expiry}>
            Gueltig bis {formatExpiry(invite.expiresAt)}
          </Text>
          <Text style={styles.single}>Einmalig nutzbar.</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.cta,
          pressed && styles.ctaPressed,
          isBusy && styles.ctaDisabled,
        ]}
        onPress={generate}
        disabled={isBusy}
      >
        {isBusy ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        )}
      </Pressable>

      <Text style={styles.privacy}>
        Dein Mate sieht nie deine Eintraege. Du behaeltst die volle Kontrolle und
        kannst die Verbindung jederzeit beenden.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 24 },
  intro: { gap: 10 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '600' },
  lede: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  codeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  codeLabel: { color: colors.label, fontSize: 13, fontWeight: '600' },
  code: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  expiry: { color: colors.textMuted, fontSize: 13 },
  single: { color: colors.textSubtle, fontSize: 12 },
  error: { color: colors.danger, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  privacy: { color: colors.textSubtle, fontSize: 13, lineHeight: 20 },
});
