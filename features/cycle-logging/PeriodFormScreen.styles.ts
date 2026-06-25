// Styles for PeriodFormScreen — extracted to keep the screen file within the
// 300-line constitution limit.
import { StyleSheet } from 'react-native';

import { colors, radii, spacing, typography } from '../../lib/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Sheet header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 8,
  },
  // Close control: 38×38 rounded-square r12, inputDisabled bg + chipBorder border
  // (design.md) — matches the shared TopBar back-affordance.
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.inputDisabled,
    borderColor: colors.chipBorder,
    borderWidth: 1,
  },
  closeBtnPressed: { opacity: 0.7 },
  // Sheet title: DM Sans 600 18/22, ls -0.02em per the artboard (not Title 16).
  sheetTitle: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.02 * 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 38 },

  // Intro line: Inter 400 15/22 per the artboard (not bodySm 14/20).
  intro: {
    ...typography.bodySm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    paddingHorizontal: spacing.screen,
    paddingBottom: 8,
  },

  // Scrollable field area
  scrollArea: { flex: 1 },
  fields: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  error: { color: colors.danger, fontSize: 14 },

  // Delete (edit-only)
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 17,
    marginTop: 8,
  },
  deleteBtnPressed: { opacity: 0.7 },
  deleteBtnText: { color: colors.danger, fontSize: 16, fontWeight: '600' },

  // Pinned footer + CTA — no top divider (design.md), top 16 / bottom 30.
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 30,
    backgroundColor: colors.bg,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: 17,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPress },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
