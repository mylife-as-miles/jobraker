import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function OnboardingLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Complete Your Profile',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}