import * as WebBrowser from 'expo-web-browser';
import React from 'react';

// Silence the warning about missing HMR annd such
WebBrowser.maybeCompleteAuthSession();

/**
 * This hook is used to warm up the browser for a faster OAuth flow.
 * It's not required, but it can improve the user experience.
 * It's recommended to call this hook in the screen that initiates the OAuth flow.
 * It should be called when the component mounts.
 */
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
