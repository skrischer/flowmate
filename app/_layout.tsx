import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { SignInScreen } from '../features/auth/SignInScreen';
import { resolveOnboardingNeeded } from '../lib/data';
import { colors } from '../lib/theme';

function Spinner() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// Authenticated app stack. The first-run fork is layered in front of it via
// initialRouteName (spec-pairing.md): a stateless, unflagged account starts on
// the onboarding gate; everyone else starts on the Flower home. This is
// navigation-only — no role is persisted (the shell stays edge-derived).
function AppStack({ needsOnboarding }: { needsOnboarding: boolean }) {
  return (
    <Stack
      initialRouteName={needsOnboarding ? 'onboarding' : 'index'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="periods" options={{ title: 'Zyklus-Historie' }} />
      <Stack.Screen name="period-form" options={{ title: 'Periode eintragen' }} />
      <Stack.Screen name="mood-log" options={{ title: 'Stimmung eintragen' }} />
      <Stack.Screen name="invite" options={{ title: 'Mate einladen' }} />
      <Stack.Screen name="accept-invite" options={{ title: 'Code eingeben' }} />
    </Stack>
  );
}

// Onboarding gate: resolves the first-run destination once a session exists,
// applying the spec precedence (own logs / active follower edge / completion
// flag all skip the fork). While resolving we hold the spinner so the stack
// never mounts at the wrong initial route.
function OnboardingGate() {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    resolveOnboardingNeeded()
      .then((needed) => {
        if (active) setNeedsOnboarding(needed);
      })
      .catch(() => {
        if (active) setNeedsOnboarding(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (needsOnboarding === null) {
    return <Spinner />;
  }
  return <AppStack needsOnboarding={needsOnboarding} />;
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
