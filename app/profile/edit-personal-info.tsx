import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditPersonalInfoScreen() {
  const { user } = useUser();
  const router = useRouter();
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  
  // Form state with default values from Clerk user
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
  const [phone, setPhone] = useState(user?.phoneNumbers?.[0]?.phoneNumber || '');
  const [location, setLocation] = useState(user?.unsafeMetadata?.location as string || '');
  
  // Validation state
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const validate = () => {
    const newErrors = {
      firstName: firstName.trim() ? '' : 'First name is required',
      lastName: '',
      email: email.trim() ? '' : 'Email is required',
      phone: '',
    };
    
    // Email validation
    if (email.trim() && !email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Phone validation (optional field)
    if (phone.trim() && !(/^\+?[\d\s-]{10,15}$/).test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSave = async () => {
    try {
      if (!validate()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // In a real app, you'd update both Clerk user data and Supabase profile
      if (user) {
        await user.update({
          firstName,
          lastName,
          unsafeMetadata: {
            ...user.unsafeMetadata,
            location,
          }
        });
        
        // If phone number changed, you'd update it separately via Clerk API
        
        console.log('personal_info_updated');
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success',
          'Your personal information has been updated.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Edit Personal Info',
        headerLeft: () => (
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <ThemedText style={{ color: primaryColor }}>Cancel</ThemedText>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={isSaving}
          >
            <ThemedText style={{ 
              color: primaryColor,
              opacity: isSaving ? 0.5 : 1,
            }}>
              {isSaving ? 'Saving...' : 'Save'}
            </ThemedText>
          </TouchableOpacity>
        ),
      }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>First Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: errors.firstName ? '#FF6B6B' : 'rgba(255,255,255,0.2)' }
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={placeholderColor}
            />
            {errors.firstName ? (
              <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Last Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: errors.lastName ? '#FF6B6B' : 'rgba(255,255,255,0.2)' }
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={placeholderColor}
            />
            {errors.lastName ? (
              <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: errors.email ? '#FF6B6B' : 'rgba(255,255,255,0.2)' }
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? (
              <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
            ) : null}
            <ThemedText style={styles.helperText}>
              To change your primary email, you'll need to verify the new email address.
            </ThemedText>
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: errors.phone ? '#FF6B6B' : 'rgba(255,255,255,0.2)' }
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number (optional)"
              placeholderTextColor={placeholderColor}
              keyboardType="phone-pad"
            />
            {errors.phone ? (
              <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Location</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: 'rgba(255,255,255,0.2)' }
              ]}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State/Province (optional)"
              placeholderTextColor={placeholderColor}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: primaryColor }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    opacity: 0.7,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});