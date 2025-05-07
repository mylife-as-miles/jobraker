import { ClerkProvider, SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from "expo-constants";
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from "expo-secure-store";
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import SignInScreen from "./sign-in"; // Import the sign-in screen

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

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (isSignedIn && !inTabsGroup) {
      router.replace('/(tabs)/index'); // Or your default signed-in screen
    } else if (!isSignedIn && inTabsGroup) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    // Optionally, return a loading indicator here
    return null;
  }

  // Conditionally render based on sign-in state
  // This structure assumes sign-in is a modal or separate stack
  // If sign-in is part of the main stack, this logic might need adjustment
  if (!isSignedIn) {
    // If not signed in, and not already on the sign-in screen, redirect.
    // This also handles the case where the initial route is protected.
    if (segments[0] !== 'sign-in') {
        // Can't use router.replace here during initial render of a navigator.
        // Stack.Screen for sign-in will handle displaying it.
    }
    return (
        <Stack>
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            {/* Redirect non-matching routes for signed-out users to sign-in */}
            <Stack.Screen name="+not-found" options={{}} />
            {/* Add a catch-all to redirect to sign-in if trying to access other routes when signed out */}
            {segments[0] !== 'sign-in' && <Stack.Screen name="[...missing]">
                {() => <Redirect href="/sign-in" />}
            </Stack.Screen>}
        </Stack>
    );
  }

  // User is signed in, render the main app layout
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      {/* If somehow sign-in is accessed while signed in, redirect to tabs */}
      <Stack.Screen name="sign-in">
        {() => <Redirect href="/(tabs)/index" />}
      </Stack.Screen>
    </Stack>
  );
};

export default function RootLayout() {