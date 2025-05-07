import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

// Silence the warning about missing HMR annd such
WebBrowser.maybeCompleteAuthSession();

/**
 * This hook is used to warm up the browser for a faster OAuth flow.
 * It's not required, but it can improve the user experience.
 * It's recommended to call this hook in the screen that initiates the OAuth flow.
 * It should be called when the component mounts.
 * 
 * Note: warmUpAsync and coolDownAsync are not available on web platform.
 */
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Only run on native platforms (iOS, Android)
    if (Platform.OS !== 'web') {
      // Warm up the browser to improve UX
      // https://docs.expo.dev/guides/authentication/#improving-user-experience
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
    // Return empty cleanup function for web platform
    return () => {};
  }, []);
};
