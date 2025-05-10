// Import polyfills first to ensure proper environment setup
import '@/utils/browserPolyfill';
import '@/utils/reanimated-web-init';

import { Colors } from '@/constants/Colors';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ColorValue,
  Dimensions, KeyboardAvoidingView, Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';

// Ensure WebBrowser completes authentication session
WebBrowser.maybeCompleteAuthSession();

// Import local-authentication only if it's available
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  // Dynamic import to prevent crash if module is not available
  LocalAuthentication = require('expo-local-authentication');
} catch (error) {
  console.log('expo-local-authentication is not available');
}

const { width, height } = Dimensions.get('window');

// Animated floating label text input component
interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  textContentType?: 'none' | 'emailAddress' | 'password' | 'name';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  icon,
  keyboardType = 'default',
  textContentType = 'none',
  autoCapitalize = 'none',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useSharedValue(value !== '' ? 1 : 0);

  React.useEffect(() => {
    animatedIsFocused.value = withTiming(
      (isFocused || value !== '') ? 1 : 0,
      { duration: 200 }
    );
  }, [isFocused, value]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const top = interpolate(
      animatedIsFocused.value,
      [0, 1],
      [18, 0]
    );
    const fontSize = interpolate(
      animatedIsFocused.value,
      [0, 1],
      [16, 12]
    );
    const color = interpolate(
      animatedIsFocused.value,
      [0, 1],
      [0, 1]
    );

    return {
      position: 'absolute' as const, // Use 'as const' to specify the literal type
      left: 44,
      top,
      fontSize,
      color: color === 0 ? Colors.dark.placeholder : Colors.dark.tint,
      backgroundColor: Colors.dark.inputBackground,
      paddingHorizontal: 4,
      zIndex: 1,
    };
  });

  return (
    <View style={styles.inputContainer}>
      <Ionicons
        name={icon as any}
        size={20}
        color={isFocused ? Colors.dark.tint : Colors.dark.icon}
        style={styles.inputIcon}
      />
      
      <Animated.Text style={labelAnimatedStyle}>
        {label}
      </Animated.Text>
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        textContentType={textContentType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={Colors.dark.placeholder}
      />
    </View>
  );
};

// Animated button component with press animation
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, isLoading = false }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.primaryButtonContainer, animatedStyle]}>
      <Pressable
        onPress={() => {
          scale.value = withSequence(
            withTiming(0.95, { duration: 100 }),
            withTiming(1, { duration: 200 })
          );
          onPress();
        }}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.9 }
        ]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.dark.background} size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const AnimatedGradient: React.FC<{ colors: string[] }> = ({ colors }) => {
  return (
    <LinearGradient
      colors={colors as unknown as [ColorValue, ColorValue, ...ColorValue[]]}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
};

// Social login button component
interface SocialButtonProps {
  icon: string;
  provider: string;
  onPress: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon, provider, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    onPress();
  };

  return (
    <Animated.View style={[styles.socialButtonContainer, animatedStyle]}>
      <TouchableOpacity
        style={styles.socialButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <FontAwesome5 name={icon} size={20} color={Colors.dark.text} />
        <Text style={styles.socialButtonText}>
          Continue with {provider}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SignInScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passwordScore, setPasswordScore] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  // Animation values
  const formOpacity = useSharedValue(1);
  const formTranslateY = useSharedValue(0);
  const pageTranslateX = useSharedValue(0);

  // Clerk Auth hooks
  const { startOAuthFlow: googleAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: appleAuth } = useOAuth({ strategy: "oauth_apple" });
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const toggleAuthMode = () => {
    // Reset form fields and errors
    setErrorMsg(null);
    formOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      })();
      
      pageTranslateX.value = isSignUp ? 0 : width;
      formTranslateY.value = withTiming(20, { duration: 0 }, () => {
        formOpacity.value = withTiming(1, { duration: 300 });
        formTranslateY.value = withTiming(0, { duration: 300 });
      });
    });

    setIsSignUp(!isSignUp);
  };

  const scorePassword = (pass: string): number => {
    let score = 0;
    if (!pass) return score;

    // Award points for length
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;

    // Award points for complexity
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    return Math.min(score, 5);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    return confirmPassword === password;
  };

  const validateName = (name: string): boolean => {
    return name.length >= 2;
  };

  const shakeAnimation = () => {
    formTranslateY.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleAuth = async () => {
    setErrorMsg(null);
    
    if (isSignUp) {
      if (!validateEmail(email)) {
        setErrorMsg('Please enter a valid email address');
        shakeAnimation();
        return;
      }
      if (!validatePassword(password)) {
        setErrorMsg('Password must be at least 8 characters');
        shakeAnimation();
        return;
      }
      if (!validateConfirmPassword(confirmPassword)) {
        setErrorMsg('Passwords do not match');
        shakeAnimation();
        return;
      }
      if (!validateName(name)) {
        setErrorMsg('Please enter your name');
        shakeAnimation();
        return;
      }

      // Handle sign up
      try {
        setIsLoading(true);
        const signUpResult = await signUp?.create({
          emailAddress: email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '',
        });

        if (signUpResult?.status === 'complete') {
          await setSignUpActive?.({ session: signUpResult.createdSessionId });
          router.navigate('/(onboarding)' as any);
        } else {
          // This is usually for email verification
          // Handle verification flow if needed
          router.navigate('/verify-email' as any);
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'errors' in error) {
          const clerkError = error as { errors: Array<{ message: string }> };
          setErrorMsg(clerkError.errors[0]?.message || 'Sign up failed');
        } else if (error instanceof Error) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg('An unknown error occurred during sign up');
        }
        shakeAnimation();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle sign in
      try {
        setIsLoading(true);
        const signInResult = await signIn?.create({
          identifier: email,
          password,
        });

        if (signInResult?.status === 'complete') {
          // Add type assertion for unsafeMetadata
          const userData = signInResult.userData as any;
          const hasCompletedOnboarding = userData.unsafeMetadata?.onboardingCompleted === true;
          
          // Set the session as active
          await setSignInActive?.({ session: signInResult.createdSessionId });
          
          // Navigate based on onboarding status
          if (hasCompletedOnboarding) {
            router.navigate('/(tabs)' as any);
          } else {
            router.navigate('/(onboarding)' as any);
          }
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'errors' in error) {
          const clerkError = error as { errors: Array<{ message: string }> };
          setErrorMsg(clerkError.errors[0]?.message || 'Sign in failed');
        } else if (error instanceof Error) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg('An unknown error occurred during sign in');
        }
        shakeAnimation();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { createdSessionId, signIn, signUp, setActive } = await googleAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        // Determine if user is new by checking if signUp is defined and has a status
        const isNewUser = signUp?.status === 'complete';
        if (isNewUser) {
          router.navigate('/(onboarding)' as any);
        } else {
          router.navigate('/(tabs)' as any);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('An error occurred during Google authentication');
      }
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { createdSessionId, signIn, signUp, setActive } = await appleAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        // Determine if user is new by checking if signUp is defined and has a status
        const isNewUser = signUp?.status === 'complete';
        if (isNewUser) {
          router.navigate('/(onboarding)' as any);
        } else {
          router.navigate('/(tabs)' as any);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('An error occurred during Apple authentication');
      }
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      setPasswordScore(scorePassword(password));
    } else {
      setPasswordScore(0);
    }
  }, [password]);

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4A80F0', '#22AEFF'] as unknown as [ColorValue, ColorValue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      
      <View style={styles.overlay}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Sign up to continue' 
                  : 'Sign in to continue'
                }
              </Text>
            </View>
            
            {errorMsg ? (
              <Animated.View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.dark.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            ) : null}

            {isSignUp && (
              <FloatingLabelInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                textContentType="name"
                autoCapitalize="words"
              />
            )}

            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
            />

            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
              textContentType="password"
            />

            {isSignUp && (
              <>
                {/* Password strength indicator */}
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthTrack}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.passwordStrengthSegment,
                          idx < passwordScore && {
                            backgroundColor: 
                              passwordScore <= 2 ? Colors.dark.error :
                              passwordScore <= 3 ? '#FFA500' : // Orange
                              Colors.dark.success
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.passwordStrengthText}>
                    {passwordScore === 0 ? '' :
                     passwordScore <= 2 ? 'Weak' :
                     passwordScore <= 3 ? 'Good' : 'Strong'}
                  </Text>
                </View>

                <FloatingLabelInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  icon="checkmark-circle-outline"
                  textContentType="password"
                />
              </>
            )}

            {!isSignUp && (
              <View style={styles.rememberForgotContainer}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked
                  ]}>
                    {rememberMe && <Ionicons name="checkmark" size={12} color={Colors.dark.background} />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            )}

            <PrimaryButton
              title={isSignUp ? 'Sign Up' : 'Sign In'}
              onPress={handleAuth}
              isLoading={isLoading}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <SocialButton
                icon="google"
                provider="Google"
                onPress={handleGoogleAuth}
              />
              
              <SocialButton
                icon="apple"
                provider="Apple"
                onPress={handleAppleAuth}
              />
            </View>

            <View style={styles.switchAuthContainer}>
              <Text style={styles.switchAuthText}>
                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
              </Text>
              <TouchableOpacity onPress={toggleAuthMode}>
                <Text style={styles.switchAuthLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.icon,
    marginBottom: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  errorText: {
    color: Colors.dark.error,
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: Colors.dark.inputBackground,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 18,
  },
  input: {
    flex: 1,
    paddingLeft: 40,
    paddingRight: 10,
    color: Colors.dark.text,
    fontSize: 16,
  },
  rememberForgotContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  rememberMeText: {
    color: Colors.dark.icon,
    fontSize: 14,
  },
  forgotPasswordText: {
    color: Colors.dark.tint,
    fontSize: 14,
  },
  primaryButtonContainer: {
    width: '100%',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    color: Colors.dark.icon,
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButtonContainer: {
    flex: 0.48,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  socialButtonText: {
    color: Colors.dark.text,
    marginLeft: 10,
    fontSize: 14,
  },
  switchAuthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  switchAuthText: {
    color: Colors.dark.icon,
    fontSize: 14,
  },
  switchAuthLink: {
    color: Colors.dark.tint,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    width: '100%',
    marginBottom: 20,
  },
  passwordStrengthTrack: {
    flexDirection: 'row',
    height: 5,
    backgroundColor: Colors.dark.border,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  passwordStrengthSegment: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  passwordStrengthText: {
    fontSize: 12,
    color: Colors.dark.icon,
    alignSelf: 'flex-end',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// Extend the UserData interface to include unsafeMetadata
declare module '@clerk/clerk-expo' {
  interface UserData {
    unsafeMetadata?: {
      onboardingCompleted?: boolean;
      [key: string]: any;
    };
  }
}
