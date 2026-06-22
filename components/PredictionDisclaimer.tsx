// Shared "prediction, not a guarantee" disclaimer atom (constitution: every
// fertility / prediction surface renders it). Single fixed text in one place so
// it is never duplicated inline per surface (spec-flower-experience constraint).
// Rendered as a circled "i" mark plus a caption, per docs/design.md.
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../lib/theme';

/** The one fixed disclaimer string shown on every prediction surface. */
export const DISCLAIMER_TEXT = 'Prognose, keine Garantie.';

/** The mandatory disclaimer shown on every prediction / fertility surface. */
export function PredictionDisclaimer() {
  return (
    <View style={styles.row}>
      <View style={styles.mark}>
        <Text style={styles.markText}>i</Text>
      </View>
      <Text style={styles.caption}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: colors.textSubtle, fontSize: 11, fontWeight: '600' },
  caption: { color: colors.textSubtle, fontSize: 12 },
});
