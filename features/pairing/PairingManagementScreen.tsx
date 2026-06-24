// Flower · Pairing-Management (docs/design.md, spec-pairing.md): the owner views
// their current pairing(s) and revokes a Mate's access. Revoke flips the edge to
// `revoked` via lib/data; the follower's shared_state SELECT policy matches only
// `active` edges, so the Mate's derived read is cut immediately (enforced by RLS,
// not app code). Pairing is Flower-managed and one-directional: no follower leave
// in v1. Profile reads go through the profiles_select_active_partner RLS policy —
// access is cut on revoke. All access goes through lib/data; no raw health data
// on this surface.
//
// Changes (issues #101, #102, #103):
//   #101 — "Was [Mate] sieht" TransparencyCard moved to its own /mate-preview
//          screen (#156); this screen is management/revoke only.
//   #102 — Mate identity: Avatar + name + "Verbunden" pill badge via getPartnerProfile.
//   #103 — Remove duplicate "Mein Mate" heading; add trash icon to revoke; add caption.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import { colors } from '../../lib/theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { styles } from './PairingManagementScreen.styles';

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
    setPartnerProfile(null);
    // allSettled: a profile fetch failure does not prevent the pairing list from
    // rendering — the display name falls back to "Mate" gracefully.
    const [pairingsResult, profileResult] = await Promise.allSettled([
      listActivePairings(),
      getPartnerProfile(),
    ]);
    if (pairingsResult.status === 'rejected') {
      const cause = pairingsResult.reason;
      setError(cause instanceof Error ? cause.message : 'Verbindung konnte nicht geladen werden.');
      setPairings([]);
    } else {
      setPairings(pairingsResult.value);
    }
    if (profileResult.status === 'fulfilled') {
      setPartnerProfile(profileResult.value);
    }
    // Profile fetch failure is silent — fallback label "Mate" handles it.
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
        pairings.map((pairing) => (
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
  partnerProfile: PartnerProfile | null;
  isPending: boolean;
  isBusy: boolean;
  onStartRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
};

type ConfirmProps = {
  displayLabel: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Inline confirm/cancel shown after tapping "Mate entfernen" (no native dialog).
function InlineConfirm({ displayLabel, isBusy, onCancel, onConfirm }: ConfirmProps) {
  return (
    <View style={styles.confirm}>
      <Text style={styles.confirmText}>
        Verbindung beenden? {displayLabel} verliert sofort den Zugriff. Du
        kannst danach jederzeit neu einladen.
      </Text>
      <View style={styles.confirmActions}>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
          onPress={onCancel}
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
          onPress={onConfirm}
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
  );
}

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
        <InlineConfirm
          displayLabel={displayLabel}
          isBusy={isBusy}
          onCancel={onCancelRevoke}
          onConfirm={onConfirmRevoke}
        />
      ) : (
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

