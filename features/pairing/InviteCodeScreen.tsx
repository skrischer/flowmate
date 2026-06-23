// Flower · Invite-Code (docs/design.md, spec-pairing.md): the owner mints a
// single-use, 24h invite code and shares it out-of-band; the Mate types it on
// the "Code eingeben" screen. The plaintext token exists only in this response
// (the server stores its hash) so it is shown once per generation; regenerating
// mints a fresh code. All access goes through lib/data; no direct Supabase
// calls, no raw health data on this surface.
import { useState } from 'react';
import {
  ActivityIndicator,
  // TODO(clipboard): Migrate to expo-clipboard once added as a project dep.
  // react-native's built-in Clipboard is deprecated but still functional in RN 0.85.
  Clipboard,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TrustRow } from '../../components/TrustRow';
import { Icon } from '../../components/Icon';
import { createInvite, type Invite } from '../../lib/data';
import { colors, radii, spacing, typography } from '../../lib/theme';

/** Returns true when the invite's expiry timestamp has passed. */
function isExpired(invite: Invite): boolean {
  return new Date(invite.expiresAt).getTime() < Date.now();
}

export function InviteCodeScreen() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError(null);
    setIsBusy(true);
    setCopied(false);
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

  const handleCopy = () => {
    if (!invite) return;
    Clipboard.setString(invite.token);
    setCopied(true);
    // Reset copy-feedback label after 2 s.
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!invite) return;
    try {
      // Dismissed and shared are both fine; genuine errors (permissions) propagate.
      await Share.share({ message: invite.token });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Teilen fehlgeschlagen.');
    }
  };

  const expired = invite !== null && isExpired(invite);
  // Primary generate: no code yet or expired; secondary: active code present.
  const generateIsPrimary = !invite || expired;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lede}>
        Teile diesen Code mit deinem Mate. Er sieht danach nur deine Phase und
        sanfte Hinweise — nie deine Eintraege.
      </Text>

      <View style={[styles.codeCard, expired && styles.codeCardExpired]}>
        <Text style={styles.codeLabel}>DEIN EINLADUNGS-CODE</Text>

        {invite ? (
          <>
            <Text
              style={[styles.code, expired && styles.codeExpired]}
              selectable={!expired}
            >
              {invite.token}
            </Text>
            {expired ? (
              <View style={styles.statusRow}>
                <Icon name="clock" size={13} color={colors.danger} />
                <Text style={styles.expiredText}>
                  Code abgelaufen · nicht mehr gueltig
                </Text>
              </View>
            ) : (
              <Text style={styles.validCaption}>
                Gueltig 24 Stunden · nur einmal verwendbar
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.codePlaceholder}>— — — — — — — —</Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {invite && !expired ? (
        <View style={styles.primaryActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={handleCopy}
          >
            <Icon name="copy" size={18} color={colors.onPrimary} />
            <Text style={styles.actionBtnText}>
              {copied ? 'Kopiert' : 'Code kopieren'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={handleShare}
          >
            <Icon name="share" size={18} color={colors.onPrimary} />
            <Text style={styles.actionBtnText}>Code teilen</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          generateIsPrimary ? styles.primaryBtn : styles.secondaryBtn,
          pressed && (generateIsPrimary ? styles.primaryBtnPressed : styles.secondaryBtnPressed),
          isBusy && styles.btnDisabled,
        ]}
        onPress={() => void generate()}
        disabled={isBusy}
      >
        {isBusy ? (
          <ActivityIndicator
            color={generateIsPrimary ? colors.onPrimary : colors.primary}
          />
        ) : (
          <View style={styles.btnInner}>
            <Icon
              name="refresh"
              size={16}
              color={generateIsPrimary ? colors.onPrimary : colors.primary}
            />
            <Text
              style={generateIsPrimary ? styles.primaryBtnText : styles.secondaryBtnText}
            >
              {invite ? 'Neuen Code generieren' : 'Code generieren'}
            </Text>
          </View>
        )}
      </Pressable>

      <TrustRow caption="Du kannst die Verbindung jederzeit widerrufen." />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 20 },

  lede: {
    ...typography.bodySm,
    color: colors.textMuted,
  },

  // Code card
  codeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  codeCardExpired: {
    borderColor: colors.danger,
    opacity: 0.7,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    letterSpacing: 0.08 * 11, // wider than base caption — matches all-caps artboard label
  },
  // No token for large code display; DM Sans between h2 (22) and h1 (32).
  code: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 2,
    color: colors.primary,
  },
  codeExpired: {
    color: colors.textSubtle,
    textDecorationLine: 'line-through',
  },
  codePlaceholder: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: 3,
    color: colors.textSubtle,
    opacity: 0.35,
  },
  validCaption: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expiredText: {
    ...typography.caption,
    color: colors.danger,
  },

  // Primary actions (copy + share) — shown when an active code is present
  primaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  actionBtnPressed: { backgroundColor: colors.primaryPress },
  actionBtnText: {
    ...typography.label,
    color: colors.onPrimary,
  },

  // Generate button — primary variant (no code yet, or expired)
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryBtnPressed: { backgroundColor: colors.primaryPress },
  primaryBtnText: {
    ...typography.label,
    color: colors.onPrimary,
    fontSize: 16,
  },

  // Generate button — secondary variant (active code already visible)
  secondaryBtn: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnPressed: { backgroundColor: colors.hairline },
  secondaryBtnText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 15,
  },

  btnDisabled: { opacity: 0.6 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  error: {
    ...typography.bodySm,
    color: colors.danger,
  },
});
