import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from "expo-constants";
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  
  // Simulate onboarding completion. In a real app, this would come from Clerk user.unsafeMetadata or your DB.
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return user?.unsafeMetadata?.onboardingCompleted === true;
  });

  useEffect(() => {
    if (!isLoaded) return;

    // Update onboardingCompleted state if user metadata changes during the session
    if (user?.unsafeMetadata?.onboardingCompleted !== undefined && 
        user.unsafeMetadata.onboardingCompleted !== onboardingCompleted) {
      setOnboardingCompleted(user.unsafeMetadata.onboardingCompleted as boolean);
    }

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (isSignedIn) {
      if (!onboardingCompleted && !inOnboardingGroup) {
        console.log("Redirecting to onboarding as it is not completed and user is not in onboarding group.");
        router.replace('/(onboarding)'); // Default to index of onboarding group
      } else if (onboardingCompleted && !inTabsGroup) {
        console.log("Redirecting to tabs as onboarding is completed and user is not in tabs group.");
        router.replace('/(tabs)'); // Default to index of tabs group
      }
      // If user is in the correct group (e.g. signed in, onboarding not done, and in onboarding group), do nothing.
    } else { // Not signed in
      // If not signed in and trying to access a protected route (onboarding or tabs), redirect to sign-in
      if (inTabsGroup || inOnboardingGroup) {
        console.log("Redirecting to sign-in as user is not signed in and tried to access a protected route.");
        router.replace('/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, user, onboardingCompleted, segments, router]);

  if (!isLoaded) {
    return null; // Or a global loading screen
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ClerkProvider>
  );
}
