// Shared trust/sovereignty caption shown on invite surfaces (Flower · Invite-Code
// and later Mate · Code eingeben). A lock icon followed by a short sovereignty line.
// The caption text is passed as a prop so each surface can use context-specific copy.
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../lib/theme';
import { Icon } from './Icon';

export interface TrustRowProps {
  /** Short sovereignty or trust statement rendered next to the lock icon. */
  caption: string;
  /**
   * Visual tone. 'muted' (default) renders the caption in textSubtle; 'primary'
   * highlights it in the primary lavender — useful on surfaces with a stronger
   * trust emphasis.
   */
  tone?: 'muted' | 'primary';
}

/** Lock icon + short sovereignty caption line. Reused across invite surfaces. */
export function TrustRow({ caption, tone = 'muted' }: TrustRowProps) {
  const captionColor = tone === 'primary' ? colors.primary : colors.textSubtle;
  return (
    <View style={styles.row}>
      <Icon name="lock" size={14} color={captionColor} />
      <Text style={[styles.caption, { color: captionColor }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // design.md / findings: lock-to-caption gap is 8px (not the 6px default)
  },
  // Revoke/trust note: Inter 400 12/16 per the artboard — not the 11/15 Caption token.
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
});
