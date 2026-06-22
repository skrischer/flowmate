// Flower · Pairing-Management (docs/design.md, spec-pairing.md): the owner views
// their current pairing(s) and revokes a Mate's access. Revoke flips the edge to
// `revoked` via lib/data; the follower's shared_state SELECT policy matches only
// `active` edges, so the Mate's derived read is cut immediately (enforced by RLS,
// not app code). Pairing is Flower-managed and one-directional: no follower leave
// in v1. The owner cannot read the Mate's profile (own-row RLS), so the status is
// shown generically with the connection date. All access goes through lib/data;
// no raw health data on this surface.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { listActivePairings, revokePairing, type Pairing } from '../../lib/data';
import { colors, radii, spacing } from '../../lib/theme';

/** Renders an ISO timestamp as a de-DE date (e.g. 23.06.2026). */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PairingManagementScreen() {
  const router = useRouter();
  const [pairings, setPairings] = useState<Pairing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPairings(await listActivePairings());
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : 'Verbindung konnte nicht geladen werden.',
      );
    }
  }, []);

  // Reload on focus so returning from re-invite reflects a fresh pairing.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const revoke = async (pairingId: string) => {
    setError(null);
    setBusyId(pairingId);
    try {
      await revokePairing(pairingId);
      setPendingId(null);
      await load();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : 'Verbindung konnte nicht beendet werden.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Mein Mate</Text>
        <Text style={styles.lede}>
          Dein Mate sieht nie deine Eintraege. Du behaeltst die volle Kontrolle
          und kannst die Verbindung jederzeit beenden.
        </Text>
      </View>

      {pairings === null ? (
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : pairings.length === 0 ? (
        <EmptyState onInvite={() => router.push('/invite')} />
      ) : (
        pairings.map((pairing) => (
          <PairingCard
            key={pairing.id}
            pairing={pairing}
            isPending={pendingId === pairing.id}
            isBusy={busyId === pairing.id}
            onStartRevoke={() => setPendingId(pairing.id)}
            onCancelRevoke={() => setPendingId(null)}
            onConfirmRevoke={() => {
              void revoke(pairing.id);
            }}
          />
        ))
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

// No active pairing: nothing to revoke, so offer the re-invite path instead.
function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Kein Mate verbunden</Text>
      <Text style={styles.bodyMuted}>
        Lade einen Mate ein, damit er auf deinen Zyklus eingestimmt bleibt.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={onInvite}
      >
        <Text style={styles.ctaText}>Mate einladen</Text>
      </Pressable>
    </View>
  );
}

type CardProps = {
  pairing: Pairing;
  isPending: boolean;
  isBusy: boolean;
  onStartRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
};

// One active edge: connected status, the connection date, and the revoke action.
// Tapping "Mate entfernen" reveals an inline confirm/cancel (no native dialog).
function PairingCard({
  pairing,
  isPending,
  isBusy,
  onStartRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.cardTitle}>Mate verbunden</Text>
      </View>
      <Text style={styles.bodyMuted}>Verbunden seit {formatDate(pairing.created_at)}</Text>

      {isPending ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>
            Verbindung beenden? Dein Mate verliert sofort den Zugriff auf deine
            Phase. Du kannst spaeter neu einladen.
          </Text>
          <View style={styles.confirmActions}>
            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
              onPress={onCancelRevoke}
              disabled={isBusy}
            >
              <Text style={styles.secondaryText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.danger,
                pressed && styles.dangerPressed,
                isBusy && styles.ctaDisabled,
              ]}
              onPress={onConfirmRevoke}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.dangerText}>Beenden</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.revoke, pressed && styles.secondaryPressed]}
          onPress={onStartRevoke}
        >
          <Text style={styles.revokeText}>Mate entfernen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 24 },
  intro: { gap: 10 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '600' },
  lede: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
  revoke: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
  },
  revokeText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  confirm: { gap: 14 },
  confirmText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  secondary: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
  },
  secondaryPressed: { opacity: 0.7 },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  danger: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
  },
  dangerPressed: { opacity: 0.8 },
  dangerText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  ctaDisabled: { opacity: 0.6 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
});
