/**
 * Root Expo Router layout.
 *
 * Responsibilities:
 * - Initialize global providers (React Query, i18n, theme)
 * - Configure navigation root
 * - Handle splash screen dismissal
 * - Set up font loading
 *
 * Phase 0: Minimal shell.
 * Phase 1: ThemeProvider wraps the brand and component preview screen.
 * Phase 2: Navigation and onboarding; Phase 4: Firebase Auth and API-backed profile sync.
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { LocaleProvider } from '../src/lib/locale';
import { useAuthStore } from '../src/features/auth/auth-store';

// Keep splash screen visible until assets are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Phase 0: dismiss immediately; Phase 1+ will await font/asset loading
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => initializeAuth(), [initializeAuth]);

  return (
    <LocaleProvider>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </LocaleProvider>
  );
}

function ThemedRoot() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="brand-preview" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
