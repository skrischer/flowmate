// Shared topbar back-button (docs/design.md, docs/specs/spec-design-reconciliation.md):
// a 38×38 rounded-square back control (radius 12, bg #241F2E = inputDisabled,
// border #322B3D = chipBorder, chevron-back glyph) with an optional title, used
// in place of the native Expo-Router stack header on sub-screens. Token-driven so
// every back-affordance stays identical across surfaces.
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../lib/theme';
import { Icon } from './Icon';

export interface TopBarProps {
  /** Optional heading shown next to the back button (design shows a title on most sub-screens). */
  title?: string;
}

/** Reusable back-button topbar that pops the navigation stack via router.back(). */
export function TopBar({ title }: TopBarProps) {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          hitSlop={8}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Icon name="back" size={20} color={colors.text} />
        </Pressable>
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 8,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputDisabled,
    borderColor: colors.chipBorder,
    borderWidth: 1,
  },
  buttonPressed: { opacity: 0.7 },
  title: {
    ...typography.title,
    color: colors.text,
  },
});
