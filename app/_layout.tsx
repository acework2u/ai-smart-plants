import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../utils/silenceExpoGoPushWarning';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

// Guard to ensure we only run onboarding navigation once per app session
let didNavigateOnboarding = false;

export default function RootLayout() {
  const [loaded] = useFonts({
    // Using system fonts for now - no custom fonts required
  });
  const pathname = usePathname();
  const router = useRouter();
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Unified initial route: show onboarding only on first run
  const didNavigateRef = useRef(false);
  useEffect(() => {
    if (!loaded || didNavigateRef.current || didNavigateOnboarding) return;

    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
        const hasSeen = seen === 'true';

        if (!hasSeen && pathname !== '/simple-onboarding') {
          didNavigateRef.current = true;
          didNavigateOnboarding = true;
          router.replace('/simple-onboarding');
          setNavReady(true);
          return;
        }

        if (hasSeen && pathname === '/simple-onboarding') {
          didNavigateRef.current = true;
          didNavigateOnboarding = true;
          router.replace('/(tabs)');
          setNavReady(true);
          return;
        }

        // No redirect needed
        didNavigateRef.current = true;
        didNavigateOnboarding = true;
        setNavReady(true);
      } catch (e) {
        // On error, fall back to showing home
        didNavigateRef.current = true;
        didNavigateOnboarding = true;
        if (pathname === '/simple-onboarding') {
          router.replace('/');
        }
        setNavReady(true);
      }
    };

    checkOnboarding();
  }, [loaded]);

  if (!loaded || !navReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="simple-onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="analyzing" options={{ headerShown: false }} />
            <Stack.Screen name="result" options={{ headerShown: false }} />
            <Stack.Screen name="debug" options={{ headerShown: false }} />
            <Stack.Screen
              name="plant/[id]"
              options={{
                headerShown: true,
                title: 'Plant Details'
              }}
            />
            <Stack.Screen
              name="activity/[id]"
              options={{
                headerShown: true,
                title: 'Activity Log'
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
