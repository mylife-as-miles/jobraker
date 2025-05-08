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
import { setSupabaseToken } from '@/utils/supabase';

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
  const { isLoaded, isSignedIn, user, getToken } = useUser();
  const segments = useSegments();
  const router = useRouter();
  
  // Simulate onboarding completion. In a real app, this would come from Clerk user.unsafeMetadata or your DB.
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return user?.unsafeMetadata?.onboardingCompleted === true;
  });

  // Synchronize Clerk JWT with Supabase
  useEffect(() => {
    const syncSupabaseAuth = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Get JWT token from Clerk
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

    // Check current route group - using type assertion to avoid TypeScript errors
    const firstSegment = segments[0] as string;
    const inTabsGroup = firstSegment === '(tabs)';
    // TypeScript thinks segments[0] can only be one of the known values, 
    // but at runtime, it could be '(onboarding)' as well
    const inOnboardingGroup = firstSegment === '(onboarding)';

    if (isSignedIn) {
      if (!onboardingCompleted && !inOnboardingGroup) {
        console.log("Redirecting to onboarding");
        // Type assertion to tell TypeScript this is a valid path
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
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
