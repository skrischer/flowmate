// BrandMark — the Flowmate logo mark shown above the wordmark on Auth, Onboarding,
// and Mate-Code screens. A single reusable source; do NOT recreate it inline.
//
// Usage:
//   import { BrandMark } from '../components/BrandMark';
//   <BrandMark />          // default 56dp
//   <BrandMark size={72} /> // larger variant for Auth
//
// Design reference: docs/design.md (Heather Dark) + Paper artboard "Shared · Auth".
// Composition: rounded-square container (surface-raised bg, primary border) with
// a pulse/wave icon in primary — matches the tilde mark visible in Paper designs.
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { colors, radii } from '../lib/theme';

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
    borderColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
