import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser'; // Assuming you'll create this hook
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from "expo-web-browser";
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const SignInScreen = () => {
  useWarmUpBrowser(); // Optional: warms up the browser for faster OAuth flow

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
        // Navigate to home or dashboard
      } else {
        // Use signIn or signUp for next steps such as MFA
        // For example, if signUp.verifications.emailAddress.needsMfa is true,
        // you can navigate to an MFA screen and ask the user to verify their email.
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Jobraker</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <Button title="Sign in with Google" onPress={onPress} />
      {/* Add Sign in with LinkedIn later */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: 'gray',
  },
});

export default SignInScreen;
