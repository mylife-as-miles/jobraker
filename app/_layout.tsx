// Import polyfill and reanimated initialization first
import '@/utils/browserPolyfill';
import '@/utils/reanimated-web-init';

import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from "expo-constants";
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
// Conditionally import 'react-native-gesture-handler' to avoid web issues

import { useColorScheme } from '@/hooks/useColorScheme';
import { setSupabaseToken } from '@/utils/supabase';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      // Use SecureStore on native platforms
      if (Platform.OS !== 'web') {
        return SecureStore.getItemAsync(key);
      }
      // Use localStorage on web
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      // Use SecureStore on native platforms
      if (Platform.OS !== 'web') {
        return SecureStore.setItemAsync(key, value);
      }
      // Use localStorage on web
      localStorage.setItem(key, value);
      return;
    } catch (err) {
      return;
    }
  },
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Track onboarding completion status
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return user?.unsafeMetadata?.onboardingCompleted === true;
  });

  // Synchronize Clerk JWT with Supabase
  useEffect(() => {
    const syncSupabaseAuth = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Get JWT token from Clerk with the supabase template
          const token = await getToken({ template: 'supabase' });
          
          // Set the token in Supabase client
          await setSupabaseToken(token);
          
          console.log('Supabase auth synchronized with Clerk');
        } catch (error) {
          console.error('Error synchronizing Supabase auth:', error);
        }
      }
    };
    
    syncSupabaseAuth();
  }, [isLoaded, isSignedIn, user, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    // Update onboardingCompleted state if user metadata changes
    if (user?.unsafeMetadata?.onboardingCompleted !== undefined && 
        user.unsafeMetadata.onboardingCompleted !== onboardingCompleted) {
      setOnboardingCompleted(user.unsafeMetadata.onboardingCompleted as boolean);
    }

    // Check current route group
    const firstSegment = segments[0] as string;
    const inTabsGroup = firstSegment === '(tabs)';
    const inOnboardingGroup = firstSegment === '(onboarding)';

    if (isSignedIn) {
      if (!onboardingCompleted && !inOnboardingGroup) {
        console.log("Redirecting to onboarding");
        router.navigate({
          pathname: '/(onboarding)' as any
        });
      } else if (onboardingCompleted && !inTabsGroup) {
        console.log("Redirecting to tabs");
        router.navigate({
          pathname: '/(tabs)' as any
        });
      }
    } else { // Not signed in
      if (inTabsGroup || inOnboardingGroup) {
        console.log("Redirecting to sign-in");
        router.navigate('/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, user, onboardingCompleted, segments, router]);

  if (!isLoaded) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
    Constants.expoConfig?.extra?.clerkPublishableKey || 
    "pk_test_ZXF1YWwtc29sZS0yOS5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          {Platform.OS === 'web' ? (
            // On web, we don't wrap with GestureHandlerRootView to avoid issues
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="sign-up" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          ) : (
            // On native, we use GestureHandlerRootView through import('react-native-gesture-handler')
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="sign-up" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          )}
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ClerkProvider>
  );
}
