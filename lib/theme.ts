// Heather Dark design tokens (docs/design.md). Shared by every UI surface so
// colors, type, and spacing stay in one place rather than scattered literals.

export const colors = {
  bg: '#1A1620',
  surface: '#221D2B',
  surfaceRaised: '#2C2538',
  hairline: '#3A3247',
  primary: '#B3A0D9',
  primaryPress: '#9F8BCB',
  onPrimary: '#231C2C',
  secondary: '#D8B79C',
  danger: '#D98C8C',
  success: '#9CB07E',
  period: '#C68B92',
  text: '#ECE6F0',
  textMuted: '#9D93A6',
  textSubtle: '#857A8E',
  label: '#C9C2CF',
  inputDisabled: '#241F2E',
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  screen: 22,
  field: 16,
} as const;

// Loaded font family names — must match the keys passed to useFonts() in
// app/_layout.tsx. Headings use DM Sans 600; body uses Inter 400/500/600.
export const fonts = {
  display: 'DMSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

// Type-scale tokens per docs/design.md. fontFamily values reference the names
// above; fontSize and lineHeight in dp; letterSpacing in dp (em × fontSize).
// fontWeight is intentionally omitted — each loaded font file encodes its own
// weight; specifying fontWeight on native selects a different file and is ignored.
export const typography = {
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.025 * 40,
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.02 * 32,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.02 * 22,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.02 * 16,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.01 * 13,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    // 0.04em at the low end of the 0.04–0.16em spec range (design.md)
    letterSpacing: 0.04 * 11,
  },
} as const;
