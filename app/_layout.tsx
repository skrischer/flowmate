import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ShellContext } from '../features/shell/ShellContext';
import { colors } from '../lib/theme';

function Spinner() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// The three destinations the authenticated app can resolve to: the Flower shell,
// the Mate shell, or the first-run onboarding fork.
type AppShell = 'flower' | 'mate' | 'onboarding';

// Authenticated app stack. The first-run fork and the owner-vs-follower shell are
// gated declaratively with Stack.Protected, keyed on the resolved shell
// (spec-pairing.md / spec-mate-push.md). Only the active shell's screen is
// registered, so the cold-start launch URL "/" cannot resolve to the wrong shell:
// a follower no longer lands on the Flower home at "/" (#147 — initialRouteName
// alone does not override the launch URL; removing the screen does). When the URL
// matches a guarded-out screen, the navigator falls back to the anchor
// (initialRouteName). Flipping the resolved shell (onboarding completion) flips
// the guards and moves the user — we never navigate into a guarded-out screen.
// Navigation-only: no role is persisted.
//
// Guards:
//   (tabs)      — Flower tab bar at /, only when shell === 'flower'.
//   mate        — Mate shell at /mate, whenever shell !== 'flower' (mate AND
//                 onboarding), so the shared accept-invite screen can land on
//                 /mate from both the onboarding follow-path and the Mate re-pair
//                 (EndedView). /mate is a real path segment, never colliding with
//                 the (tabs) shell at /.
//   onboarding  — first-run fork, only when shell === 'onboarding'.
// The remaining screens are shared sub-screens, always registered:
//   periods (Verlauf) / period-form (modal) / mate-preview (Was dein Mate sieht)
//   / invite / accept-invite (Code eingeben) / pairing (Mein Mate).
function AppStack({ shell }: { shell: AppShell }) {
  const anchor = shell === 'flower' ? '(tabs)' : shell;
  return (
    <Stack
      initialRouteName={anchor}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={shell === 'flower'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={shell !== 'flower'}>
        <Stack.Screen name="mate" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={shell === 'onboarding'}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="periods" options={{ headerShown: false }} />
      <Stack.Screen
        name="period-form"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="mate-preview" options={{ title: 'Was dein Mate sieht' }} />
      <Stack.Screen name="invite" options={{ headerShown: false }} />
      <Stack.Screen name="accept-invite" options={{ headerShown: false }} />
      <Stack.Screen name="pairing" options={{ headerShown: false }} />
    </Stack>
  );
}

// Onboarding + shell gate: resolves the destination once a session exists (spec
// precedence: own logs / active follower edge / completion flag all skip the
// fork). The resolved shell drives the Stack.Protected guards. `refresh`
// re-resolves it in place, so completing onboarding flips the guards instead of
// navigating into a guarded-out screen. We hold the spinner only on the initial
// resolve, so the stack never mounts before the shell is known.
function OnboardingGate() {
  const [shell, setShell] = useState<AppShell | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    resolveOnboardingNeeded()
      .then((needed) => (needed ? ('onboarding' as const) : resolveShell()))
      .then((next) => {
        if (mounted.current) setShell(next);
      })
      .catch(() => {
        if (mounted.current) setShell('flower');
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ refresh }), [refresh]);

  if (shell === null) {
    return <Spinner />;
  }
  return (
    <ShellContext.Provider value={value}>
      <AppStack shell={shell} />
    </ShellContext.Provider>
  );
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
