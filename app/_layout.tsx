import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { SignInScreen } from '../features/auth/SignInScreen';
import { resolveOnboardingNeeded, resolveShell } from '../lib/data';
import { colors } from '../lib/theme';

function Spinner() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// Authenticated app stack. The first-run fork and the owner-vs-follower shell are
// layered in front of it via initialRouteName (spec-pairing.md / spec-mate-push.md):
// a stateless, unflagged account starts on the onboarding gate; otherwise the
// shell is edge-derived — an active follower lands on the read-only Mate view,
// everyone else on the Flower tab shell. Navigation-only: no role is persisted.
//
// Route structure:
//   (tabs)          — Flower tab bar (Heute / Kalender / Profil); headerShown: false
//                     because the Tabs navigator manages its own headers per tab.
//   onboarding      — first-run fork (no header)
//   mate            — follower read-only shell (no header)
//   periods         — Zyklus-Historie (stack-presented from Profil tab)
//   period-form     — Periode eintragen (stack-presented from Heute / Kalender)
//   mood-log        — Stimmung eintragen (stack-presented from Heute)
//   invite          — Mate einladen (stack-presented from Profil tab)
//   accept-invite   — Code eingeben (reached via onboarding fork)
//   pairing         — Mein Mate management (stack-presented from Profil tab)
function AppStack({ initialRoute }: { initialRoute: string }) {
  return (
    <Stack
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="mate" options={{ headerShown: false }} />
      <Stack.Screen name="periods" options={{ title: 'Zyklus-Historie' }} />
      <Stack.Screen name="period-form" options={{ title: 'Periode eintragen' }} />
      <Stack.Screen name="mood-log" options={{ headerShown: false }} />
      <Stack.Screen name="invite" options={{ title: 'Mate einladen' }} />
      <Stack.Screen name="accept-invite" options={{ title: 'Code eingeben' }} />
      <Stack.Screen name="pairing" options={{ title: 'Mein Mate' }} />
    </Stack>
  );
}

// Onboarding + shell gate: resolves the first-run destination once a session
// exists. The fork wins when needed (spec precedence: own logs / active follower
// edge / completion flag all skip it); otherwise the shell is edge-derived — an
// active follower opens the Mate view, everyone else the Flower home. We hold the
// spinner while resolving so the stack never mounts at the wrong initial route.
function OnboardingGate() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveOnboardingNeeded()
      .then(async (needed) => {
        if (needed) return 'onboarding';
        return (await resolveShell()) === 'mate' ? 'mate' : '(tabs)';
      })
      .then((route) => {
        if (active) setInitialRoute(route);
      })
      .catch(() => {
        if (active) setInitialRoute('(tabs)');
      });
    return () => {
      active = false;
    };
  }, []);

  if (initialRoute === null) {
    return <Spinner />;
  }
  return <AppStack initialRoute={initialRoute} />;
}

// Auth gate: while the persisted session loads we show a spinner, then route
// unauthenticated users to the auth screen and authenticated users into the
// onboarding gate (which picks the first-run fork or the app stack).
function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!session) {
    return <SignInScreen />;
  }

  return <OnboardingGate key={session.user.id} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Hold splash until fonts are ready. On error (fontError non-null), fall through
  // silently with system fonts rather than blocking the app forever.
  if (!fontsLoaded && !fontError) {
    return <Spinner />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
