// Mate tab shell (docs/design.md — Bottom nav: Eingestimmt + Profil).
// Mirrors the Flower (tabs)/_layout.tsx bar tokens: #1E1926 bg, #2A2433 top
// border, active item primary. Navigation-only — no role is persisted here.
import { Tabs } from 'expo-router';

import { Icon } from '../../components/Icon';
import { colors } from '../../lib/theme';

const TAB_BAR_BG = '#1E1926';
const TAB_BAR_BORDER = '#2A2433';

export default function MateTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: TAB_BAR_BORDER,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eingestimmt',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="attunement" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
