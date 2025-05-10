// Import polyfills first to ensure proper environment setup
import '@/utils/browserPolyfill';
import '@/utils/reanimated-web-init';

import { Colors } from '@/constants/Colors';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useOAuth, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'expo-progress';
import { useRouter } from 'expo-router';
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ColorValue,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Reanimated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';

// Ensure WebBrowser completes authentication session
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Animated floating label text input component
const FloatingLabelInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  icon,
  keyboardType = 'default',
  textContentType = 'none',
  autoCapitalize = 'none',
  error = '', 
}: FloatingLabelInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const animatedLabelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedBorderWidth = useRef(new Animated.Value(0)).current;
  const animatedShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(animatedShake, { 
          toValue: 10, 
          duration: 50, 
          useNativeDriver: true 
        }),
        Animated.timing(animatedShake, { 
          toValue: -10, 
          duration: 50, 
          useNativeDriver: true 
        }),
        Animated.timing(animatedShake, { 
          toValue: 8, 
          duration: 50, 
          useNativeDriver: true 
        }),
        Animated.timing(animatedShake, { 
          toValue: -8, 
          duration: 50, 
          useNativeDriver: true 
        }),
        Animated.timing(animatedShake, { 
          toValue: 0, 
          duration: 50, 
          useNativeDriver: true 
        }),
      ]).start();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  useEffect(() => {
    Animated.timing(animatedLabelPosition, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(animatedBorderWidth, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.dark.icon, Colors.dark.tint],
    }),
    backgroundColor: isFocused ? Colors.dark.background : 'transparent',
    paddingHorizontal: isFocused ? 5 : 0,
    zIndex: 1,
  } as Animated.AnimatedProps<any>;

  const containerStyle = {
    borderColor: error ? '#ff6961' : animatedBorderWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.dark.border, Colors.dark.tint],
    }),
    transform: [{ translateX: animatedShake }]
  };

  return (
    <View style={styles.inputWrapper}>
      <Animated.View style={[styles.inputContainer, containerStyle]}>
        <View style={styles.inputIconContainer}>
          {icon}
        </View>
        
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={Colors.dark.icon}
        />
        
        <Animated.Text style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
        
        {secureTextEntry && (
          <Pressable 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
              size={24} 
              color={Colors.dark.icon} 
            />
          </Pressable>
        )}
      </Animated.View>
      
      {error ? (
        <Reanimated.Text 
          entering={FadeIn.duration(300)}
          style={styles.errorText}
        >
          {error}
        </Reanimated.Text>
      ) : null}
    </View>
  );
};

// Animated button component with press animation
const AnimatedButton = ({ 
  title, 
  onPress, 
  icon = null, 
  style = {},
  disabled = false,
  gradient = false,
  colors = ['#4A80F0', '#22AEFF']
}: AnimatedButtonProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.6 : opacity.value,
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.97, { duration: 100 });
      opacity.value = withTiming(0.9, { duration: 100 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  const buttonContent = (
    <View style={[styles.buttonContent, icon ? { justifyContent: 'space-between' } : {}]}>
      <Text style={styles.buttonText}>{title}</Text>
      {icon}
    </View>
  );

  return (
    <Reanimated.View style={[styles.buttonWrapper, animatedStyle, style]}>
      <Pressable
        onPress={disabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={['#4A80F0', '#22AEFF'] as unknown as [ColorValue, ColorValue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {buttonContent}
          </LinearGradient>
        ) : buttonContent}
      </Pressable>
    </Reanimated.View>
  );
};

// Social login button component
const SocialButton = ({ icon, provider, onPress }: SocialButtonProps) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };
  
  return (
    <Reanimated.View style={[styles.socialButtonWrapper, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.socialButton,
          pressed && { backgroundColor: Colors.dark.card },
        ]}
      >
        {icon}
      </Pressable>
    </Reanimated.View>
  );
};

// Multi-step sign-up indicator
const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepProgressContainer}>
        <View style={styles.stepProgressBackground} />
        <Reanimated.View
          style={[
            styles.stepProgressForeground,
            {
              width: `${(currentStep / totalSteps) * 100}%`,
            }
          ]}
        />
      </View>
      <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );
};

export default function SignUpScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  
  // Step tracking for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 3;
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // For OAuth providers
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  // For email/password auth
  const { signUp, setActive } = useSignUp();
  
  // Animation values
  const formPosition = useSharedValue(0);
  const logoScale = useSharedValue(1);
  const backgroundY = useSharedValue(0);
  
  // Password strength indicator logic
  const getPasswordStrength = (pass: string): number => {
    if (!pass) return 0;
    
    let strength = 0;
    
    // Length check
    if (pass.length >= 8) strength += 0.25;
    
    // Contains number
    if (/\d/.test(pass)) strength += 0.25;
    
    // Contains lowercase
    if (/[a-z]/.test(pass)) strength += 0.25;
    
    // Contains uppercase or special char
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength += 0.25;
    
    return strength;
  };
  
  const passwordStrength = getPasswordStrength(password);
  
  // Form validation functions
  const validateEmail = (email: string): string => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!re.test(email)) return "Invalid email format";
    return "";
  };
  
  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };
  
  const validateConfirmPassword = (confirmPassword: string): string => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };
  
  const validateName = (name: string): string => {
    if (!name) return "Name is required";
    return "";
  };
  
  const validatePhone = (phone: string): string => {
    if (!phone) return ""; // Phone is optional
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(phone)) return "Invalid phone number";
    return "";
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    let isValid = true;
    
    if (currentStep === 1) {
      const emailErr = validateEmail(email);
      const nameErr = validateName(name);
      
      setEmailError(emailErr);
      setNameError(nameErr);
      
      isValid = !emailErr && !nameErr;
    } 
    else if (currentStep === 2) {
      const passwordErr = validatePassword(password);
      const confirmPasswordErr = validateConfirmPassword(confirmPassword);
      
      setPasswordError(passwordErr);
      setConfirmPasswordError(confirmPasswordErr);
      
      isValid = !passwordErr && !confirmPasswordErr;
    }
    else if (currentStep === 3) {
      const phoneErr = validatePhone(phone);
      setPhoneError(phoneErr);
      
      if (!agreeTerms) {
        setTermsError("You must agree to the terms and conditions");
        isValid = false;
      } else {
        setTermsError("");
      }
      
      isValid = isValid && !phoneErr;
    }
    
    return isValid;
  };
  
  // Handle next step action
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      formPosition.value = withTiming(formPosition.value + 1, { duration: 400 });
      setCurrentStep(prev => prev + 1);
      
      // Add some micro-interaction
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Handle previous step action
  const handlePrevStep = () => {
    formPosition.value = withTiming(formPosition.value - 1, { duration: 400 });
    setCurrentStep(prev => prev - 1);
    
    // Add some micro-interaction
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Handle final submission
  const handleSignUp = async () => {
    if (validateCurrentStep()) {
      try {
        setLoading(true);
        
        // Actual sign up logic would go here with Clerk or your auth provider
        if (signUp) {
          await signUp.create({
            emailAddress: email,
            password,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
          });
          
          // Sign in immediately after signup
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          
          // Show success message with check animation
          setShowSuccessMessage(true);
          
          // Navigate to verification page after delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error: unknown) {
        console.error("Sign up error:", error);
        
        // Handle specific errors
        const clerkError = error as ClerkError;
        if (clerkError.errors?.[0]?.message) {
          if (clerkError.errors[0].message.includes("email")) {
            setEmailError(clerkError.errors[0].message);
          } else if (clerkError.errors[0].message.includes("password")) {
            setPasswordError(clerkError.errors[0].message);
          }
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.push('/');
      }
    } catch (err) {
      console.error("Google OAuth error", err);
    }
  };
  
  // Go to sign in page
  const goToSignIn = () => {
    router.push('/sign-in');
  };
  
  // Animated styles
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: formPosition.value * -width }
      ],
    };
  });
  
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value }
      ]
    };
  });
  
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: backgroundY.value }
      ]
    };
  });
  
  // Start background subtle animation
  useEffect(() => {
    const animateBackground = () => {
      backgroundY.value = withSequence(
        withTiming(-5, { duration: 4000 }),
        withTiming(5, { duration: 4000 }),
      );
      
      // Loop the animation
      setTimeout(animateBackground, 8000);
    };
    
    animateBackground();
  }, []);
  
  // When component mounts, animate logo
  useEffect(() => {
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 800 }),
      withTiming(1, { duration: 600 })
    );
  }, []);
  
  // Step-specific form rendering
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <Reanimated.View
            entering={FadeIn.duration(400)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Let's get started</Text>
            <Text style={styles.stepDescription}>
              Create your account to access all features
            </Text>
            
            <FloatingLabelInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              icon={<Ionicons name="person-outline" size={20} color={Colors.dark.icon} />}
              textContentType="name"
              autoCapitalize="words"
              error={nameError}
            />
            
            <FloatingLabelInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              icon={<Ionicons name="mail-outline" size={20} color={Colors.dark.icon} />}
              keyboardType="email-address"
              textContentType="emailAddress"
              error={emailError}
            />
            
            <AnimatedButton
              title="Continue"
              onPress={handleNextStep}
              icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
              gradient={true}
              style={{ marginTop: 20 }}
            />
          </Reanimated.View>
        );
        
      case 2:
        return (
          <Reanimated.View
            entering={SlideInRight.duration(400)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Secure your account</Text>
            <Text style={styles.stepDescription}>
              Create a strong password to protect your account
            </Text>
            
            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.dark.icon} />}
              textContentType="newPassword"
              error={passwordError}
            />
            
            {/* Password strength indicator */}
            {password.length > 0 && (
              <Reanimated.View 
                style={styles.passwordStrengthContainer}
                entering={FadeIn.duration(300)}
              >
                <Text style={styles.passwordStrengthText}>
                  Password strength: {
                    passwordStrength <= 0.25 ? 'Weak' :
                    passwordStrength <= 0.5 ? 'Fair' :
                    passwordStrength <= 0.75 ? 'Good' :
                    'Strong'
                  }
                </Text>
                <View style={styles.strengthBarContainer}>
                  <Reanimated.View 
                    style={[
                      styles.strengthBar,
                      { 
                        width: `${passwordStrength * 100}%`,
                        backgroundColor: passwordStrength <= 0.25 ? '#ff6961' :
                                        passwordStrength <= 0.5 ? '#ffb347' :
                                        passwordStrength <= 0.75 ? '#77dd77' :
                                        '#50C8FF'
                      }
                    ]}
                  />
                </View>
              </Reanimated.View>
            )}
            
            <FloatingLabelInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.dark.icon} />}
              textContentType="newPassword"
              error={confirmPasswordError}
            />
            
            <View style={styles.navigationButtons}>
              <AnimatedButton
                title="Back"
                onPress={handlePrevStep}
                style={{ flex: 1, marginRight: 8 }}
              />
              
              <AnimatedButton
                title="Continue"
                onPress={handleNextStep}
                icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
                gradient={true}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Reanimated.View>
        );
        
      case 3:
        return (
          <Reanimated.View
            entering={SlideInRight.duration(400)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Complete your profile</Text>
            <Text style={styles.stepDescription}>
              Add optional details and accept terms
            </Text>
            
            <FloatingLabelInput
              label="Phone Number (Optional)"
              value={phone}
              onChangeText={setPhone}
              icon={<Ionicons name="call-outline" size={20} color={Colors.dark.icon} />}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              error={phoneError}
            />
            
            <FloatingLabelInput
              label="Job Title (Optional)"
              value={jobTitle}
              onChangeText={setJobTitle}
              icon={<Ionicons name="briefcase-outline" size={20} color={Colors.dark.icon} />}
            />
            
            <FloatingLabelInput
              label="Company (Optional)"
              value={company}
              onChangeText={setCompany}
              icon={<Ionicons name="business-outline" size={20} color={Colors.dark.icon} />}
            />
            
            {/* Terms and conditions checkbox */}
            <Pressable 
              style={styles.termsContainer}
              onPress={() => {
                setAgreeTerms(!agreeTerms);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[
                styles.checkbox,
                agreeTerms && styles.checkboxChecked
              ]}>
                {agreeTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>
            
            {termsError ? (
              <Text style={styles.errorText}>{termsError}</Text>
            ) : null}
            
            <View style={styles.navigationButtons}>
              <AnimatedButton
                title="Back"
                onPress={handlePrevStep}
                style={{ flex: 1, marginRight: 8 }}
              />
              
              <AnimatedButton
                title={loading ? "Creating..." : "Create Account"}
                onPress={handleSignUp}
                disabled={loading}
                gradient={true}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Reanimated.View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Reanimated.View style={[styles.backgroundGradient, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(20, 20, 35, 0.8)', 'rgba(30, 30, 50, 0.9)', 'rgba(15, 15, 25, 1)'] as unknown as [ColorValue, ColorValue, ColorValue]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Reanimated.View>
      
      {showSuccessMessage ? (
        <Reanimated.View 
          style={styles.successContainer}
          entering={FadeInDown.duration(800)}
        >
          <Ionicons name="checkmark-circle" size={80} color="#77dd77" />
          <Text style={styles.successTitle}>Account Created!</Text>
          <Text style={styles.successText}>Please verify your email to continue.</Text>
          <Progress.Bar 
            progress={1} 
            color="#77dd77" 
            style={{marginTop: 20, width: 200}} 
          />
        </Reanimated.View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Logo and title */}
            <Reanimated.View 
              style={[styles.logoContainer, logoAnimatedStyle]}
              entering={FadeInDown.delay(100).duration(800).springify()}
            >
              <Ionicons name="rocket-outline" size={width * 0.15} color={Colors.dark.tint} />
              <Text style={styles.appTitle}>Jobraker</Text>
            </Reanimated.View>
            
            {/* Step indicator */}
            <StepIndicator 
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
            />
            
            {/* Form container */}
            <Reanimated.View 
              style={[styles.formOuterContainer, {width: width * 0.88}]}
              entering={FadeInUp.delay(400).duration(1000)}
            >
              {/* Horizontally scrollable form */}
              <Reanimated.View 
                style={[styles.formContainer, formAnimatedStyle, {width: width * 0.88 * TOTAL_STEPS}]}
              >
                {renderStepContent()}
              </Reanimated.View>
            </Reanimated.View>
            
            {/* Social sign up options */}
            {currentStep === 1 && (
              <Reanimated.View
                entering={FadeInUp.delay(600).duration(800)}
              >
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or sign up with</Text>
                  <View style={styles.divider} />
                </View>
                
                <View style={styles.socialButtonsContainer}>
                  <SocialButton 
                    icon={<Ionicons name="logo-google" size={24} color="#DB4437" />}
                    provider="Google"
                    onPress={handleGoogleSignIn}
                  />
                  <SocialButton
                    icon={<Ionicons name="logo-linkedin" size={24} color="#0A66C2" />}
                    provider="LinkedIn"
                    onPress={() => console.log('LinkedIn sign-in')}
                  />
                  <SocialButton
                    icon={<Ionicons name="logo-apple" size={24} color="#fff" />}
                    provider="Apple"
                    onPress={() => console.log('Apple sign-in')}
                  />
                </View>
                
                {/* Already have an account */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    Already have an account?
                  </Text>
                  <Pressable 
                    onPress={goToSignIn}
                    style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
                  >
                    <Text style={styles.toggleButtonText}>
                      Sign In
                    </Text>
                  </Pressable>
                </View>
              </Reanimated.View>
            )}
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: height * 0.05,
    paddingBottom: height * 0.05,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: width * 0.06,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.03,
  },
  appTitle: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
  stepIndicatorContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepProgressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stepProgressBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  stepProgressForeground: {
    height: '100%',
    backgroundColor: Colors.dark.tint,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    color: Colors.dark.icon,
  },
  formOuterContainer: {
    overflow: 'hidden',
    marginBottom: 20,
  },
  formContainer: {
    flexDirection: 'row',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.dark.icon,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 12,
    position: 'relative',
  },
  inputIconContainer: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#ff6961',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  passwordStrengthContainer: {
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  passwordStrengthText: {
    color: Colors.dark.icon,
    fontSize: 12,
    marginBottom: 4,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    backgroundColor: Colors.dark.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  termsText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  termsLink: {
    color: Colors.dark.tint,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: Colors.dark.icon,
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  socialButtonWrapper: {
    marginHorizontal: 10,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleText: {
    color: Colors.dark.icon,
    fontSize: 14,
  },
  toggleButton: {
    marginLeft: 5,
    padding: 5,
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  toggleButtonText: {
    color: Colors.dark.tint,
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
  },
  successText: {
    fontSize: 16,
    color: Colors.dark.icon,
    textAlign: 'center',
    marginTop: 8,
  },
});

// Add TypeScript interfaces for components
interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  textContentType?: 'none' | 'emailAddress' | 'password' | 'name' | 'telephoneNumber' | 'newPassword';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: object;
  disabled?: boolean;
  gradient?: boolean;
  colors?: string[];
}

interface SocialButtonProps {
  icon: React.ReactNode;
  provider: string;
  onPress: () => void;
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// Add error type for Clerk errors
interface ClerkError {
  errors: Array<{ message: string }>;
}