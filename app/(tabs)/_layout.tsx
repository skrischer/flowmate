// Flower owner tab bar (docs/design.md — Bottom nav: #1E1926 bg, #2A2433 top
// border; active item primary). Three tabs: Heute / Kalender / Profil.
// Secondary screens (periods, mood-log, invite, pairing) remain stack routes
// outside this group and are reached via router.push from within these tabs.
import { Tabs } from 'expo-router';

import { Icon } from '../../components/Icon';
import { colors } from '../../lib/theme';

const TAB_BAR_BG = '#1E1926';
const TAB_BAR_BORDER = '#2A2433';

export default function TabsLayout() {
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
          title: 'Heute',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="today" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={String(color)} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
