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
  danger: '#D98C8C',
  success: '#9CB07E',
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

export const fonts = {
  display: 'System',
  body: 'System',
} as const;
