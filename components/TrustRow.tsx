// Shared trust/sovereignty caption shown on invite surfaces (Flower · Invite-Code
// and later Mate · Code eingeben). A lock icon followed by a short sovereignty line.
// The caption text is passed as a prop so each surface can use context-specific copy.
import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../lib/theme';
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
    gap: 6,
  },
  caption: {
    ...typography.caption,
    flexShrink: 1,
  },
});
