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
import { TopBar } from '../../components/TopBar';
import { createInvite, type Invite } from '../../lib/data';
import { colors, fonts, radii, spacing, typography } from '../../lib/theme';

// Disabled-text grey (design.md: "disabled: #5A5263 text"). Used for the expired
// token; not a named color token, kept local to this surface.
const EXPIRED_TOKEN_COLOR = '#5A5263';
// Copy pill text (design.md / findings): a lighter lavender than `primary`,
// reading on the raised pill surface. Local to this card's copy affordance.
const COPY_PILL_TEXT = '#C3B3E6';

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
    <View style={styles.screen}>
      <TopBar title="Mate einladen" />
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lede}>
        {expired
          ? 'Dieser Code ist abgelaufen. Generiere einen neuen, um deinen Mate einzuladen.'
          : 'Teile diesen Code mit deinem Mate. Er sieht danach nur deine Phase und sanfte Hinweise — nie deine Einträge.'}
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>DEIN EINLADUNGS-CODE</Text>

        {invite ? (
          <>
            {/* adjustsFontSizeToFit + numberOfLines keeps the token inside the
                card: it shrinks rather than bleeding past the card edges. */}
            <Text
              style={[styles.code, expired && styles.codeExpired]}
              selectable={!expired}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
            >
              {invite.token}
            </Text>
            {expired ? (
              <Text style={styles.expiredText}>
                Code abgelaufen · nicht mehr gültig
              </Text>
            ) : (
              <Text style={styles.validCaption}>
                Gültig 24 Stunden · nur einmal verwendbar
              </Text>
            )}
            {!expired ? (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.copyPill,
                  pressed && styles.copyPillPressed,
                ]}
                onPress={handleCopy}
              >
                <Icon name="copy" size={16} color={COPY_PILL_TEXT} />
                <Text style={styles.copyPillText}>
                  {copied ? 'Kopiert' : 'Code kopieren'}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={styles.codePlaceholder}>— — — — — — — —</Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {invite && !expired ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.shareBtn,
            pressed && styles.shareBtnPressed,
          ]}
          onPress={handleShare}
        >
          <Icon name="share" size={18} color={colors.onPrimary} />
          <Text style={styles.shareBtnText}>Code teilen</Text>
        </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, gap: 24 },

  // Lede: Inter 400 15/23 per the artboard — one step up from the bodySm token.
  lede: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },

  // Code card — base hairline border (#2F2839) in every state; the expired
  // variant keeps the same frame (no danger border, no opacity dimming).
  codeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 18,
  },
  // "DEIN EINLADUNGS-CODE": Inter 600 12, ls 0.16em per the artboard (not Caption 11 500).
  codeLabel: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.textSubtle,
    letterSpacing: 0.16 * 12,
  },
  // Invite token: DM Sans 38/46, ls 0.08em, primary text color per the artboard.
  // (Design specifies weight 700; only DM Sans 600 is loaded app-wide, so the
  // closest loaded weight is used — see the PR note on the 700 weight.)
  code: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: 0.08 * 38,
    color: colors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  codeExpired: {
    color: EXPIRED_TOKEN_COLOR,
  },
  codePlaceholder: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 3,
    color: colors.textSubtle,
    opacity: 0.35,
  },
  validCaption: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  expiredText: {
    ...typography.caption,
    color: colors.danger,
  },

  // Copy affordance — a pill that sits INSIDE the code card (raised surface fill,
  // lighter-lavender text) rather than a primary-fill button outside it.
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  copyPillPressed: { backgroundColor: colors.hairline },
  copyPillText: {
    ...typography.label,
    color: COPY_PILL_TEXT,
  },

  // "Code teilen" — full-width primary button below the card.
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 17,
  },
  shareBtnPressed: { backgroundColor: colors.primaryPress },
  shareBtnText: {
    ...typography.label,
    color: colors.onPrimary,
    fontSize: 16,
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

  // Generate button — secondary variant (active code already visible): outline,
  // transparent fill with the base hairline border (not a surfaceRaised fill).
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnPressed: { backgroundColor: colors.surface },
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
