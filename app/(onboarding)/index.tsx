import { useUser } from '@clerk/clerk-expo';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

// Fix imports to use named exports instead of default exports
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { uploadResume } from '@/services/storageService';
import { upsertUserPreferences, upsertUserProfile } from '@/services/userService';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';

type OnboardingStep = 'personal-info' | 'job-preferences' | 'resume-upload' | 'complete';

export default function OnboardingScreen() {
  const { user, isLoaded } = useUser();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  
  // Form state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal-info');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumbers?.[0]?.phoneNumber || '',
    location: '',
    desiredJobTitle: '',
    targetSalary: '',
    workArrangement: '',
    resume: null as { name: string; uri: string } | null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResumeUpload = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('onboarding_resume_upload_attempted');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      // Make sure assets exist before accessing
      if (result.assets && result.assets.length > 0) {
        setFormData(prev => ({
          ...prev,
          resume: {
            name: result.assets[0].name,
            uri: result.assets[0].uri,
          },
        }));
        
        console.log('onboarding_resume_upload_success');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      console.log('onboarding_resume_upload_failed');
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
    }
  };

  const goToNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 'personal-info') {
      if (!formData.fullName.trim()) {
        Alert.alert('Required Field', 'Please enter your full name to continue.');
        return;
      }
      setCurrentStep('job-preferences');
    } else if (currentStep === 'job-preferences') {
      if (!formData.desiredJobTitle.trim()) {
        Alert.alert('Required Field', 'Please enter at least one desired job title.');
        return;
      }
      setCurrentStep('resume-upload');
    } else if (currentStep === 'resume-upload') {
      setCurrentStep('complete');
    } else if (currentStep === 'complete') {
      completeOnboarding();
    }
  };

  const goToPreviousStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 'job-preferences') {
      setCurrentStep('personal-info');
    } else if (currentStep === 'resume-upload') {
      setCurrentStep('job-preferences');
    } else if (currentStep === 'complete') {
      setCurrentStep('resume-upload');
    }
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information is missing. Please try again or contact support.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // 1. Save user profile to Supabase
      await upsertUserProfile({
        id: user.id,
        clerk_user_id: user.id,
        full_name: formData.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        phone_number: formData.phoneNumber,
        location: formData.location,
      });
      
      // 2. Parse salary string to get min/max values
      let salaryMin: number | null = null;
      let salaryMax: number | null = null;
      
      if (formData.targetSalary) {
        // Handle formats like "80000" or "80k" or "$80,000" or "80,000-100,000" or "$80k-$100k"
        const sanitized = formData.targetSalary.replace(/[$,]/g, '');
        const parts = sanitized.split('-');
        
        if (parts.length > 0) {
          const minPart = parts[0].trim().toLowerCase();
          salaryMin = parseInt(minPart.replace('k', '000'));
          
          if (parts.length > 1) {
            const maxPart = parts[1].trim().toLowerCase();
            salaryMax = parseInt(maxPart.replace('k', '000'));
          }
        }
      }
      
      // 3. Save user preferences to Supabase
      try {
        // Save job preferences
        const preferences = {
          user_id: user.id,
          preferred_job_titles: [formData.desiredJobTitle],
          work_arrangement: formData.workArrangement ? [formData.workArrangement] : undefined,
          target_locations: [{
            city: formData.location,
            state: undefined,
            country: undefined
          }],
          salary_min: salaryMin !== null ? salaryMin : undefined,
          salary_max: salaryMax !== null ? salaryMax : undefined,
        };

        // Upload to Supabase
        await upsertUserPreferences(preferences);
        
        // Upload resume if present
        if (formData.resume?.uri) {
          const storagePath = await uploadResume(user.id, formData.resume.uri, formData.resume.name);
          
          if (!storagePath) {
            throw new Error('Failed to upload resume');
          }
          
          // Update user profile with resume URL
          await upsertUserProfile({
            id: user.id,
            resume_url: storagePath,
          });
        }
        
        // Mark onboarding as complete in Clerk
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingCompleted: true,
          },
        });
        
        console.log('new_user_onboarding_completed');
        // AuthProvider will handle navigation
      } catch (error) {
        console.error('Error completing onboarding:', error);
        Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      setIsLoading(false);
    }
  };

  const skipOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Skip Onboarding',
      'You can always update your profile later. Are you sure you want to skip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            if (user) {
              setIsLoading(true);
              try {
                // Save minimal profile information to Supabase
                if (user.id) {
                  await upsertUserProfile({
                    id: user.id,
                    clerk_user_id: user.id,
                    full_name: user.fullName || '',
                    email: user.primaryEmailAddress?.emailAddress || '',
                  });
                }
                
                // Mark onboarding as complete in Clerk
                await user.update({
                  unsafeMetadata: {
                    ...user.unsafeMetadata,
                    onboardingCompleted: true,
                  },
                });
                
                console.log('new_user_onboarding_skipped');
                // AuthProvider will handle navigation
              } catch (error) {
                console.error('Error skipping onboarding:', error);
                Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }
          }
        },
      ]
    );
  };

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Tell us about yourself</ThemedText>
      <ThemedText style={styles.stepDescription}>
        This information helps us personalize your job search and application experience.
      </ThemedText>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="John Smith"
          placeholderTextColor={placeholderColor}
          value={formData.fullName}
          onChangeText={(text) => updateFormField('fullName', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Phone Number (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="+1 (555) 555-5555"
          placeholderTextColor={placeholderColor}
          keyboardType="phone-pad"
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormField('phoneNumber', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Location (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="City, State/Province"
          placeholderTextColor={placeholderColor}
          value={formData.location}
          onChangeText={(text) => updateFormField('location', text)}
        />
      </View>
    </View>
  );
  
  const renderJobPreferencesStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Job Preferences</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Let's find jobs that match your career goals.
      </ThemedText>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Desired Job Title(s)</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="e.g. Software Engineer, Product Manager"
          placeholderTextColor={placeholderColor}
          value={formData.desiredJobTitle}
          onChangeText={(text) => updateFormField('desiredJobTitle', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Target Salary (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="e.g. $80,000"
          placeholderTextColor={placeholderColor}
          keyboardType="numeric"
          value={formData.targetSalary}
          onChangeText={(text) => updateFormField('targetSalary', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Preferred Work Arrangement (Optional)</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: placeholderColor }]}
          placeholder="e.g. Remote, Hybrid, On-site"
          placeholderTextColor={placeholderColor}
          value={formData.workArrangement}
          onChangeText={(text) => updateFormField('workArrangement', text)}
        />
      </View>
    </View>
  );
  
  const renderResumeUploadStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Upload Your Resume</ThemedText>
      <ThemedText style={styles.stepDescription}>
        A resume is required for applying to jobs with Jobraker automation.
      </ThemedText>
      
      {formData.resume ? (
        <View style={styles.resumeContainer}>
          <ThemedText style={styles.resumeTitle}>Current Resume:</ThemedText>
          <ThemedText style={styles.resumeName}>{formData.resume.name}</ThemedText>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleResumeUpload}
          >
            <ThemedText style={styles.buttonText}>Replace Resume</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, { borderColor: primaryColor }]}
          onPress={handleResumeUpload}
        >
          <ThemedText style={[styles.uploadButtonText, { color: primaryColor }]}>
            Upload Resume (PDF, Word)
          </ThemedText>
        </TouchableOpacity>
      )}
      
      <ThemedText style={styles.skipText}>
        You can also upload your resume later from the Profile tab.
      </ThemedText>
    </View>
  );
  
  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>You're All Set!</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Thanks for providing your information. You're now ready to start using Jobraker to find and apply for jobs.
      </ThemedText>
      
      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryTitle}>Profile Summary:</ThemedText>
        
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Name:</ThemedText>
          <ThemedText style={styles.summaryValue}>{formData.fullName}</ThemedText>
        </View>
        
        {formData.location && (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Location:</ThemedText>
            <ThemedText style={styles.summaryValue}>{formData.location}</ThemedText>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Desired Role:</ThemedText>
          <ThemedText style={styles.summaryValue}>{formData.desiredJobTitle}</ThemedText>
        </View>
        
        {formData.resume && (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Resume:</ThemedText>
            <ThemedText style={styles.summaryValue}>{formData.resume.name}</ThemedText>
          </View>
        )}
      </View>
      
      <ThemedText style={styles.noteText}>
        You can always update your profile information and preferences in the Profile tab.
      </ThemedText>
    </View>
  );
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'personal-info':
        return renderPersonalInfoStep();
      case 'job-preferences':
        return renderJobPreferencesStep();
      case 'resume-upload':
        return renderResumeUploadStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Saving your information...</ThemedText>
        </View>
      )}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {['personal-info', 'job-preferences', 'resume-upload', 'complete'].map((step, index) => (
              <View 
                key={step} 
                style={[
                  styles.progressDot,
                  { backgroundColor: currentStep === step ? primaryColor : placeholderColor }
                ]}
              />
            ))}
          </View>
          
          {renderCurrentStep()}
          
          <View style={styles.buttonContainer}>
            {currentStep !== 'personal-info' && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: primaryColor }]}
                onPress={goToPreviousStep}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: primaryColor }]}>
                  Back
                </ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton, 
                { backgroundColor: primaryColor },
                currentStep !== 'personal-info' && { flex: 1, marginLeft: 12 }
              ]}
              onPress={goToNextStep}
            >
              <ThemedText style={styles.primaryButtonText}>
                {currentStep === 'complete' ? 'Finish' : 'Next'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {currentStep !== 'complete' && (
            <TouchableOpacity style={styles.skipContainer} onPress={skipOnboarding}>
              <ThemedText style={styles.skipText}>Skip for now</ThemedText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  stepContainer: {
    flex: 1,
    marginVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resumeContainer: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  resumeName: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  skipText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginVertical: 10,
  },
  summaryContainer: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: 100,
  },
  summaryValue: {
    fontSize: 16,
    flex: 1,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 20,
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'white',
  },
});