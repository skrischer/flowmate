// BrandMark — the Flowmate logo mark shown above the wordmark on Auth, Onboarding,
// and Mate-Code screens. A single reusable source; do NOT recreate it inline.
//
// Usage:
//   import { BrandMark } from '../components/BrandMark';
//   <BrandMark />          // default 56dp
//   <BrandMark size={64} /> // Auth + Onboarding variant
//
// Design reference: docs/design.md (Heather Dark) + Paper artboard "Shared · Auth".
// Composition: rounded-square container (surface-raised bg, ring border) with
// a pulse/wave icon in primary — matches the tilde mark visible in Paper designs.
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { colors } from '../lib/theme';

// Brand-mark corner radius per the Auth/Onboarding artboards — between radii.md
// (14) and radii.lg (24), so it lives here rather than as a shared spacing token.
const BRAND_RADIUS = 20;

export interface BrandMarkProps {
  /** Container size in dp (width = height). Defaults to 56. */
  size?: number;
}

/** The Flowmate brand mark: lavender wave on a raised rounded square. */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  const iconSize = Math.round(size * 0.5);
  const containerStyle = [
    styles.container,
    { width: size, height: size },
  ];

  return (
    <View style={containerStyle}>
      <Icon name="attunement" size={iconSize} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.ring,
    borderRadius: BRAND_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
