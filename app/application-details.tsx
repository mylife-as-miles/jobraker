import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

// Temporary mock data - would be replaced with Supabase fetch
const MOCK_APPLICATIONS = {
  '1': {
    id: '1',
    job_title: 'Senior React Native Developer',
    company_name: 'TechCorp Inc.',
    company_website: 'https://techcorp-example.com',
    job_url: 'https://techcorp-example.com/careers/senior-react-native-developer',
    status: 'SUBMITTED_BY_SKYVERN',
    status_details: { confirmation_id: 'APP12345' },
    applied_at: new Date().toISOString(),
    last_status_update_at: new Date().toISOString(),
    notes: '',
    location: 'San Francisco, CA (Remote)',
    salary: '$150,000 - $180,000',
    job_description: 'TechCorp is seeking an experienced React Native developer to join our mobile team...',
  },
  '2': {
    id: '2',
    job_title: 'Frontend Engineer',
    company_name: 'StartupXYZ',
    company_website: 'https://startupxyz-example.com',
    job_url: 'https://startupxyz-example.com/jobs/frontend-engineer',
    status: 'PROCESSING_BY_SKYVERN',
    status_details: { current_step: 'filling_form', progress: 0.7 },
    applied_at: new Date(Date.now() - 86400000).toISOString(),
    last_status_update_at: new Date(Date.now() - 3600000).toISOString(),
    notes: '',
    location: 'New York, NY (Hybrid)',
    salary: '$120,000 - $150,000',
    job_description: 'StartupXYZ is looking for a talented Frontend Engineer to help build our next-gen web application...',
  },
  '3': {
    id: '3',
    job_title: 'Mobile Developer',
    company_name: 'Innovative Solutions',
    company_website: 'https://innovative-solutions-example.com',
    job_url: 'https://innovative-solutions-example.com/careers/mobile-developer',
    status: 'REQUIRES_ATTENTION_USER_INPUT',
    status_details: { 
      reason: 'CAPTCHA', 
      message: 'Please solve the CAPTCHA to continue your application',
      action_url: 'https://innovative-solutions-example.com/careers/apply/captcha',
    },
    applied_at: new Date(Date.now() - 172800000).toISOString(),
    last_status_update_at: new Date(Date.now() - 7200000).toISOString(),
    notes: 'Need to follow up about the technical interview',
    location: 'Austin, TX (On-site)',
    salary: '$130,000 - $160,000',
    job_description: 'Innovative Solutions is seeking a Mobile Developer to join our growing team...',
  },
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper to get human-readable status text
const getStatusText = (status: string) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return 'Submitted';
    case 'PROCESSING_BY_SKYVERN': return 'Processing';
    case 'REQUIRES_ATTENTION_USER_INPUT': return 'Action Required';
    case 'FAILED_SKYVERN_SUBMISSION': return 'Failed';
    default: return status.replace(/_/g, ' ').toLowerCase();
  }
};

// Helper to get status color
const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return colors.success;
    case 'PROCESSING_BY_SKYVERN': return colors.warning;
    case 'REQUIRES_ATTENTION_USER_INPUT': return colors.warning;
    case 'FAILED_SKYVERN_SUBMISSION': return colors.error;
    default: return colors.text;
  }
};

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const applicationId = Array.isArray(id) ? id[0] : id;
  const [application, setApplication] = useState<any>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();
  
  // Theme colors
  const primaryColor = useThemeColor({}, 'tint');
  const statusColor = application ? 
    getStatusColor(application.status, { 
      success: '#4CAF50', 
      warning: '#FF9800', 
      error: '#F44336', 
      text: '#FFFFFF' 
    }) : '#FFFFFF';

  // Fetch application details
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    if (applicationId && MOCK_APPLICATIONS[applicationId as keyof typeof MOCK_APPLICATIONS]) {
      setApplication(MOCK_APPLICATIONS[applicationId as keyof typeof MOCK_APPLICATIONS]);
      setNotes(MOCK_APPLICATIONS[applicationId as keyof typeof MOCK_APPLICATIONS].notes);
      console.log('application_details_viewed', { applicationId });
    }
  }, [applicationId]);

  const handleEditNotes = () => {
    setIsEditingNotes(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveNotes = () => {
    // In a real app, this would update Supabase
    setApplication(prev => ({ ...prev, notes }));
    setIsEditingNotes(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('application_notes_updated', { applicationId });
  };

  const handleWithdrawApplication = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would update status in Supabase
            setApplication(prev => ({ 
              ...prev, 
              status: 'WITHDRAWN_BY_USER',
              last_status_update_at: new Date().toISOString()
            }));
            console.log('application_withdrawn', { applicationId });
            Alert.alert('Application Withdrawn', 'Your application has been successfully withdrawn.');
          }
        }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleOpenJobUrl = () => {
    if (!application?.job_url) return;
    
    console.log('application_job_url_opened', { applicationId });
    // This would use Linking.openURL in a real implementation
    Alert.alert('Opening URL', `Opening job posting: ${application.job_url}`);
  };

  const handleTakeAction = () => {
    if (!application?.status_details?.action_url) return;
    
    console.log('application_action_taken', { applicationId });
    // This would use Linking.openURL in a real implementation
    Alert.alert('Opening URL', `Opening action URL: ${application.status_details.action_url}`);
  };

  if (!application) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Application Details' }} />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading application details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Application Details',
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={primaryColor} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <ThemedText style={styles.jobTitle}>{application.job_title}</ThemedText>
          <ThemedText style={styles.companyName}>{application.company_name}</ThemedText>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusText}>
              {getStatusText(application.status)}
            </ThemedText>
          </View>
        </View>
        
        {/* Application Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Application Details</ThemedText>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Applied on:</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(application.applied_at)}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Last updated:</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(application.last_status_update_at)}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Location:</ThemedText>
            <ThemedText style={styles.detailValue}>{application.location}</ThemedText>
          </View>
          
          {application.salary && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Salary range:</ThemedText>
              <ThemedText style={styles.detailValue}>{application.salary}</ThemedText>
            </View>
          )}
          
          {application.status_details?.confirmation_id && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Confirmation ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{application.status_details.confirmation_id}</ThemedText>
            </View>
          )}
        </View>
        
        {/* Status Details (if available) */}
        {application.status === 'REQUIRES_ATTENTION_USER_INPUT' && (
          <View style={styles.actionSection}>
            <ThemedText style={styles.actionTitle}>{application.status_details.message}</ThemedText>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: primaryColor }]}
              onPress={handleTakeAction}
            >
              <ThemedText style={styles.actionButtonText}>Take Action</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            
            {!isEditingNotes && (
              <TouchableOpacity onPress={handleEditNotes}>
                <Ionicons name="pencil" size={18} color={primaryColor} />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingNotes ? (
            <View style={styles.notesEditContainer}>
              <ScrollView style={styles.notesTextAreaWrapper}>
                <View style={styles.textAreaContainer}>
                  <ThemedText
                    style={styles.textArea}
                    onChangeText={setNotes}
                    multiline
                  >
                    {notes}
                  </ThemedText>
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: primaryColor }]}
                onPress={handleSaveNotes}
              >
                <ThemedText style={styles.saveButtonText}>Save Notes</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <ThemedText style={styles.notesText}>
              {application.notes || "No notes added yet. Tap the pencil icon to add notes about this application."}
            </ThemedText>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={handleOpenJobUrl}
          >
            <Ionicons name="open-outline" size={18} color="#FFFFFF" style={styles.actionButtonIcon} />
            <ThemedText style={styles.actionButtonText}>Open Job Posting</ThemedText>
          </TouchableOpacity>
          
          {application.status !== 'WITHDRAWN_BY_USER' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={handleWithdrawApplication}
            >
              <Ionicons name="close-outline" size={18} color="#FFFFFF" style={styles.actionButtonIcon} />
              <ThemedText style={styles.actionButtonText}>Withdraw Application</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Job Description */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Job Description</ThemedText>
          <ThemedText style={styles.jobDescription}>{application.job_description}</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 110,
    fontSize: 15,
    opacity: 0.8,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  notesEditContainer: {
    marginBottom: 10,
  },
  notesTextAreaWrapper: {
    height: 100,
    marginBottom: 10,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    height: 100,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  saveButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  withdrawButton: {
    backgroundColor: '#F44336',
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  actionSection: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  actionTitle: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  jobDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
});