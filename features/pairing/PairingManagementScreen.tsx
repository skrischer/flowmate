// Flower · Pairing-Management (docs/design.md, spec-pairing.md): the owner views
// their current pairing(s) and revokes a Mate's access. Revoke flips the edge to
// `revoked` via lib/data; the follower's shared_state SELECT policy matches only
// `active` edges, so the Mate's derived read is cut immediately (enforced by RLS,
// not app code). Pairing is Flower-managed and one-directional: no follower leave
// in v1.
//
// Changes (issues #101, #102, #103):
//   #101 — "Was [Mate] sieht" transparency card (phase/attunement level only).
//   #102 — Mate identity: Avatar + name + "Verbunden" pill badge via getPartnerProfile.
//   #103 — Remove duplicate "Mein Mate" heading; add trash icon to revoke; add caption.
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

import {
  listActivePairings,
  revokePairing,
  getPartnerProfile,
  type Pairing,
  type PartnerProfile,
} from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';

/** Renders an ISO timestamp as a de-DE long date (e.g. 12. Mai 2026). */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PairingManagementScreen() {
  const router = useRouter();
  const [pairings, setPairings] = useState<Pairing[] | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [activePairings, profile] = await Promise.all([
        listActivePairings(),
        getPartnerProfile(),
      ]);
      setPairings(activePairings);
      setPartnerProfile(profile);
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
      {pairings === null ? (
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : pairings.length === 0 ? (
        <EmptyState onInvite={() => router.push('/invite')} />
      ) : (
        <>
          {pairings.map((pairing) => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              partnerProfile={partnerProfile}
              isPending={pendingId === pairing.id}
              isBusy={busyId === pairing.id}
              onStartRevoke={() => setPendingId(pairing.id)}
              onCancelRevoke={() => setPendingId(null)}
              onConfirmRevoke={() => {
                void revoke(pairing.id);
              }}
            />
          ))}
          <TransparencyCard mateName={partnerProfile?.displayName ?? null} />
        </>
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
  partnerProfile: PartnerProfile | null;
  isPending: boolean;
  isBusy: boolean;
  onStartRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
};

// One active edge: Mate identity (Avatar + name + badge), connection date, and the
// revoke action with trash icon + explanatory caption (#102, #103).
function PairingCard({
  pairing,
  partnerProfile,
  isPending,
  isBusy,
  onStartRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: CardProps) {
  const mateName = partnerProfile?.displayName ?? null;
  const displayLabel = mateName ?? 'Mate';

  return (
    <View style={styles.card}>
      {/* Mate identity row — Avatar, name, "Verbunden" badge (#102) */}
      <View style={styles.identityRow}>
        <Avatar displayName={mateName} size={48} />
        <View style={styles.identityInfo}>
          <Text style={styles.cardTitle}>{displayLabel}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Verbunden</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.bodyMuted}>seit {formatDate(pairing.created_at)}</Text>

      {isPending ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>
            Verbindung beenden? {displayLabel} verliert sofort den Zugriff. Du
            kannst danach jederzeit neu einladen.
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
        /* Mate entfernen with trash icon + explanatory caption (#103) */
        <View style={styles.revokeSection}>
          <Pressable
            style={({ pressed }) => [styles.revoke, pressed && styles.secondaryPressed]}
            onPress={onStartRevoke}
          >
            <Icon name="trash" size={18} color={colors.danger} />
            <Text style={styles.revokeText}>Mate entfernen</Text>
          </Pressable>
          <Text style={styles.revokeCaption}>
            {displayLabel} verliert sofort den Zugriff. Du kannst danach
            jederzeit neu einladen.
          </Text>
        </View>
      )}
    </View>
  );
}

// "Was [Mate] sieht" transparency card (#101): data-sovereignty centrepiece.
// Lists only phase-level fields shared via shared_state — never raw logs, moods,
// or exact dates. Lock footnote makes the guarantee explicit.
function TransparencyCard({ mateName }: { mateName: string | null }) {
  const label = mateName ?? 'dein Mate';
  return (
    <View style={styles.card}>
      <View style={styles.transparencyHeader}>
        <Icon name="eye" size={18} color={colors.textMuted} />
        <Text style={styles.cardTitle}>Was {label} sieht</Text>
      </View>

      <View style={styles.transparencyList}>
        <TransparencyRow label="Aktuelle Phase" value="z.B. Lutealphase" />
        <TransparencyRow label="Vorwarnung zur Periode" value="z.B. ~5 Tage" />
        <TransparencyRow label="Einstimmungshinweis" value="sanfter Hinweis" />
      </View>

      <View style={styles.lockNote}>
        <Icon name="lock" size={14} color={colors.textSubtle} />
        <Text style={styles.lockText}>
          Nie deine Eintraege, Stimmungen oder genauen Daten.
        </Text>
      </View>
    </View>
  );
}

function TransparencyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.transparencyRow}>
      <Text style={styles.transparencyLabel}>{label}</Text>
      <Text style={styles.transparencyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 22,
    gap: 14,
  },
  cardTitle: { color: colors.text, ...typography.h2 },
  bodyMuted: { color: colors.textMuted, ...typography.bodySm },
  // Mate identity (#102)
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityInfo: { flex: 1, gap: 6 },
  badgeRow: { flexDirection: 'row' },
  badge: {
    backgroundColor: colors.success + '26', // ~15 % opacity tint on the sage success colour
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.success,
    ...typography.caption,
  },
  // Revoke section with caption (#103)
  revokeSection: { gap: 8 },
  revoke: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  revokeText: { color: colors.danger, ...typography.title },
  revokeCaption: {
    color: colors.textSubtle,
    ...typography.caption,
    textAlign: 'center',
  },
  // Confirm inline flow
  confirm: { gap: 14 },
  confirmText: { color: colors.text, ...typography.bodySm },
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
  secondaryText: { color: colors.text, ...typography.title },
  danger: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
  },
  dangerPressed: { opacity: 0.8 },
  dangerText: { color: colors.onPrimary, ...typography.title },
  ctaDisabled: { opacity: 0.6 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaText: { color: colors.onPrimary, ...typography.title },
  error: { color: colors.danger, ...typography.bodySm },
  // Transparency card (#101)
  transparencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transparencyList: { gap: 10 },
  transparencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  transparencyLabel: { color: colors.textMuted, ...typography.bodySm, flex: 1 },
  transparencyValue: {
    color: colors.text,
    ...typography.bodySm,
    flex: 1,
    textAlign: 'right',
  },
  lockNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  lockText: { color: colors.textSubtle, ...typography.caption, flex: 1 },
});
