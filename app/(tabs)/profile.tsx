import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// Fix imports to use named exports instead of default exports
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useSupabase from '@/hooks/useSupabase';
import { uploadResume } from '@/services/storageService';
import { UserPreferences } from '@/services/userService';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, TouchableOpacity } from 'react-native';

import { deleteResume, getResumeUrl } from '@/services/storageService';
import { getUserPreferences, upsertUserProfile } from '@/services/userService';
import { Ionicons } from '@expo/vector-icons';

// Section component for profile sections
const ProfileSection = ({ 
  title, 
  children, 
  onPress = null
}: { 
  title: string, 
  children: React.ReactNode, 
  onPress?: (() => void) | null
}) => {
  const backgroundColor = useThemeColor({}, 'card');
  
  return (
    <TouchableOpacity 
      style={[styles.section, { backgroundColor }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const primaryColor = useThemeColor({}, 'tint');
  const { profile, isLoading: isProfileLoading, refreshProfile } = useSupabase();
  
  // State for user data
  const [isLoading, setIsLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [resumeData, setResumeData] = useState({
    name: '',
    uploadDate: '',
    url: '',
  });
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});

  // Load user preferences and resume data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Load preferences
        const userPrefs = await getUserPreferences(user.id);
        
        if (userPrefs) {
          setPreferences({
            desiredRole: userPrefs.preferred_job_titles?.[0] || '',
            targetSalary: userPrefs.salary_min && userPrefs.salary_max 
              ? `$${userPrefs.salary_min.toLocaleString()} - $${userPrefs.salary_max.toLocaleString()}`
              : userPrefs.salary_min 
                ? `$${userPrefs.salary_min.toLocaleString()}+` 
                : '',
            location: userPrefs.target_locations?.[0]?.city || '',
            workArrangement: userPrefs.work_arrangement?.[0] || '',
          });
        }
        
        // Check if user has a resume
        if (profile?.resume_url) {
          setHasResume(true);
          
          // Get signed URL for the resume
          const signedUrl = await getResumeUrl(profile.resume_url);
          
          // Extract file name from the URL
          const fileName = profile.resume_url.split('/').pop() || 'resume.pdf';
          
          setResumeData({
            name: fileName,
            uploadDate: profile.updated_at 
              ? new Date(profile.updated_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) 
              : new Date().toLocaleDateString(),
            url: signedUrl || '',
          });
        } else {
          setHasResume(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load your profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user, profile]);

  // Analytics event for profile view
  useEffect(() => {
    console.log('profile_tab_viewed');
  }, []);

  const handleSignOut = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signOut();
      console.log('user_signed_out');
      // Redirection handled by AuthProvider in _layout.tsx
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResumeUpload = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to upload a resume.');
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('profile_resume_upload_attempted');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      setIsLoading(true);
      
      // Upload to Supabase storage
      const storagePath = await uploadResume(
        user.id,
        result.assets[0].uri,
        result.assets[0].name
      );
      
      if (!storagePath) {
        throw new Error('Failed to upload resume');
      }
      
      // Update user profile with resume URL
      await upsertUserProfile({
        id: user.id,
        resume_url: storagePath,
      });
      
      // Refresh profile to get updated data
      await refreshProfile();
      
      // Update local state
      setResumeData({
        name: result.assets[0].name,
        uploadDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        url: result.assets[0].uri,
      });
      
      setHasResume(true);
      console.log('profile_resume_upload_success');
      
      // Show success message
      Alert.alert('Success', 'Resume uploaded successfully.');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      console.log('profile_resume_upload_failed');
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResume = () => {
    if (!user?.id || !profile?.resume_url) {
      Alert.alert('Error', 'No resume found to delete.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Delete from Supabase Storage
              const deleted = await deleteResume(profile.resume_url as string);
              
              if (!deleted) {
                throw new Error('Failed to delete resume');
              }
              
              // Update user profile
              await upsertUserProfile({
                id: user.id,
                resume_url: null,
              });
              
              // Refresh profile
              await refreshProfile();
              
              setHasResume(false);
              setResumeData({ name: '', uploadDate: '', url: '' });
              console.log('profile_resume_deleted');
              Alert.alert('Success', 'Resume deleted successfully.');
            } catch (error) {
              console.error('Error deleting resume:', error);
              Alert.alert('Error', 'Failed to delete resume. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleEditPersonalInfo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In the future, this would navigate to a personal info edit screen
    router.push('/profile/edit-personal-info');
  };

  const handleEditJobPreferences = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('edit_job_preferences_opened');
    // In the future, this would navigate to job preferences edit screen
    router.push('/profile/edit-job-preferences');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // This would need to trigger Clerk account deletion
            // and Supabase data anonymization/deletion
            console.log('delete_account_initiated');
            Alert.alert(
              'Account Deletion Requested',
              'Your account deletion request has been received. This process may take up to 24 hours to complete.'
            );
          }
        },
      ]
    );
  };

  // Show loading indicator while profile is loading
  if (isProfileLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'My Profile' }} />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Personal Information Section */}
        <ProfileSection title="Personal Information" onPress={handleEditPersonalInfo}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Name:</ThemedText>
            <ThemedText style={styles.value}>{profile?.full_name || user?.fullName || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Email:</ThemedText>
            <ThemedText style={styles.value}>{profile?.email || user?.primaryEmailAddress?.emailAddress || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="call-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Phone:</ThemedText>
            <ThemedText style={styles.value}>{profile?.phone_number || user?.phoneNumbers?.[0]?.phoneNumber || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Location:</ThemedText>
            <ThemedText style={styles.value}>{profile?.location || 'Not set'}</ThemedText>
          </View>
        </ProfileSection>
        
        {/* Resume Management Section */}
        <ProfileSection title="Resume Management">
          {hasResume ? (
            <>
              <View style={styles.row}>
                <Ionicons name="document-outline" size={18} color={primaryColor} />
                <ThemedText style={styles.label}>Current Resume:</ThemedText>
                <ThemedText style={styles.value}>{resumeData.name}</ThemedText>
              </View>
              
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={18} color={primaryColor} />
                <ThemedText style={styles.label}>Uploaded on:</ThemedText>
                <ThemedText style={styles.value}>{resumeData.uploadDate}</ThemedText>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: primaryColor }]}
                  onPress={handleResumeUpload}
                >
                  <ThemedText style={styles.buttonText}>Replace Resume</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDeleteResume}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ThemedText style={styles.noResumeText}>No resume uploaded</ThemedText>
              <TouchableOpacity 
                style={[styles.button, styles.uploadButton, { backgroundColor: primaryColor }]}
                onPress={handleResumeUpload}
              >
                <ThemedText style={styles.buttonText}>Upload Resume</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ProfileSection>
        
        {/* Job Preferences Section */}
        <ProfileSection title="Job Preferences" onPress={handleEditJobPreferences}>
          <View style={styles.row}>
            <Ionicons name="briefcase-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Desired Role:</ThemedText>
            <ThemedText style={styles.value}>{preferences.desiredRole || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Target Salary:</ThemedText>
            <ThemedText style={styles.value}>{preferences.targetSalary || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Preferred Location:</ThemedText>
            <ThemedText style={styles.value}>{preferences.location || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="home-outline" size={18} color={primaryColor} />
            <ThemedText style={styles.label}>Work Arrangement:</ThemedText>
            <ThemedText style={styles.value}>{preferences.workArrangement || 'Not set'}</ThemedText>
          </View>
        </ProfileSection>
        
        {/* Account Section */}
        <ProfileSection title="Account">
          <TouchableOpacity 
            style={[styles.button, styles.signOutButton, { borderColor: primaryColor }]}
            onPress={handleSignOut}
          >
            <ThemedText style={[styles.signOutButtonText, { color: primaryColor }]}>Sign Out</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.deleteAccountButton]}
            onPress={handleDeleteAccount}
          >
            <ThemedText style={styles.deleteAccountButtonText}>Delete Account</ThemedText>
          </TouchableOpacity>
        </ProfileSection>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginLeft: 8,
    width: 120,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  uploadButton: {
    width: '100%',
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: '#F44336', // Red
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    width: '100%',
  },
  signOutButtonText: {
    fontWeight: '600',
  },
  deleteAccountButton: {
    marginTop: 12,
    backgroundColor: '#F44336', // Red
    width: '100%',
  },
  deleteAccountButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noResumeText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});