// Initials-based circular avatar — no image upload exists in v1.
// Derives a single initial from a display name, falling back to a single
// letter from the email or a placeholder bullet when neither is available.
// Token-driven: background from `surfaceRaised`, text from `primary`.
// Reused by the Flower header (#80) and any partner-identity surface.
import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../lib/theme';

export interface AvatarProps {
  /** The display name to derive initials from (nullable). */
  displayName: string | null;
  /** Fallback identifier (e.g. email) used when displayName is blank. */
  fallback?: string | null;
  /** Diameter in dp. Defaults to 44. */
  size?: number;
}

/** Derives a single uppercase initial from a display name, or a single-letter fallback. */
export function initials(displayName: string | null, fallback?: string | null): string {
  const name = displayName?.trim();
  if (name && name.length > 0) {
    // Always a single letter: display names carry a parenthetical suffix
    // ("Mia (Flower-Test)"), so a first+last-word scheme yielded "M(" (#153).
    return name[0]!.toUpperCase();
  }
  const fb = fallback?.trim();
  if (fb && fb.length > 0) {
    return fb[0]!.toUpperCase();
  }
  return '·';
}

/** Circular initials avatar, size-configurable and token-driven. */
export function Avatar({ displayName, fallback, size = 44 }: AvatarProps) {
  const label = initials(displayName, fallback);
  const fontSize = Math.round(size * 0.38);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text
        style={[
          styles.label,
          {
            fontSize,
            lineHeight: fontSize * 1.2,
            fontFamily: typography.label.fontFamily,
            letterSpacing: typography.label.letterSpacing,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.primary,
  },
});
