// Styles for PairingManagementScreen — extracted to keep the screen file within
// the 300-line constitution limit.
import { StyleSheet } from 'react-native';

import { colors, radii, spacing, typography } from '../../lib/theme';

export const styles = StyleSheet.create({
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
  // Mate-name title: DM Sans 600 18/22 per the artboard (not H2 22).
  cardTitle: { color: colors.text, ...typography.h2, fontSize: 18, lineHeight: 22 },
  bodyMuted: { color: colors.textMuted, ...typography.bodySm },
  // "seit [date]": Inter 400 13/16 per the artboard (not bodySm 14/20).
  since: { color: colors.textMuted, fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityInfo: { flex: 1, gap: 6 },
  badgeRow: { flexDirection: 'row' },
  badge: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  // "Verbunden" badge: Inter 600 12/16 per the artboard (not Caption Inter 500 11).
  badgeText: { color: colors.success, fontFamily: typography.label.fontFamily, fontSize: 12, lineHeight: 16 },
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
  // "Mate entfernen": Inter 600 16/20 per the artboard (not Title DM Sans).
  revokeText: { color: colors.danger, fontFamily: typography.label.fontFamily, fontSize: 16, lineHeight: 20 },
  revokeCaption: { color: colors.textSubtle, ...typography.caption, textAlign: 'center' },
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
});
