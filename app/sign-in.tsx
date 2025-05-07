import { Colors } from '@/constants/Colors'; // Assuming Colors.ts is in constants
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons'; // For icons
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

const SignInScreen = () => {
  useWarmUpBrowser();

  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  // Placeholder for LinkedIn OAuth
  // const { startOAuthFlow: startLinkedInOAuthFlow } = useOAuth({ strategy: 'oauth_linkedin' }); 

  const onSignInWithGoogle = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startGoogleOAuthFlow();
      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
      } else {
        // Handle other flows if necessary
      }
    } catch (err) {
      console.error("Google OAuth error", err);
    }
  }, []);

  const onSignInWithLinkedIn = React.useCallback(async () => {
    // Placeholder action
    console.log("Sign in with LinkedIn pressed");
    // try {
    //   const { createdSessionId, setActive } = await startLinkedInOAuthFlow();
    //   if (createdSessionId && setActive) {
    //     setActive({ session: createdSessionId });
    //   }
    // } catch (err) {
    //   console.error("LinkedIn OAuth error", err);
    // }
  }, []);

  // Animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, { duration: 800 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const ButtonPressable = ({ onPress, iconName, text, backgroundColor, textColor, iconColor, isLinkedIn = false }: any) => {
    const scale = useSharedValue(1);
    const animatedButtonStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    return (
      <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <Pressable
          onPressIn={() => scale.value = withTiming(0.95, { duration: 100 })}
          onPressOut={() => scale.value = withTiming(1, { duration: 100 })}
          onPress={onPress}
          style={({ pressed }) => [
            styles.buttonBase,
            { backgroundColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name={iconName as any} size={24} color={iconColor || textColor} style={styles.iconStyle} />
          <Text style={[styles.buttonText, { color: textColor }]}>{text}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        <Text style={styles.appName}>Jobraker</Text>
        <Text style={styles.subtitle}>Sign in to unlock your career potential.</Text>

        <View style={styles.buttonGroup}>
          <ButtonPressable 
            onPress={onSignInWithGoogle} 
            iconName="logo-google" 
            text="Sign in with Google"
            backgroundColor="#4285F4" // Google Blue
            textColor="#FFFFFF"
          />
          <ButtonPressable 
            onPress={onSignInWithLinkedIn} 
            iconName="logo-linkedin"
            text="Sign in with LinkedIn"
            backgroundColor="#0A66C2" // LinkedIn Blue
            textColor="#FFFFFF"
            isLinkedIn={true}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background, // Using dark theme background
  },
  contentContainer: {
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed', // Modern font
  },
  subtitle: {
    fontSize: 18,
    color: Colors.dark.icon, // Softer color for subtitle
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonGroup: {
    width: '100%',
  },
  buttonContainer: {
    marginBottom: 15,
    width: '100%',
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12, // More rounded corners
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  iconStyle: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SignInScreen;
