import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

// Fix imports to use named exports instead of default exports
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useSupabase from '@/hooks/useSupabase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Application, ApplicationStatus, getUserApplications } from '@/services/applicationService';
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { RefreshControl, TouchableOpacity, View } from 'react-native';

// Helper function to get a human-readable status
const getStatusText = (status: ApplicationStatus) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return 'Submitted';
    case 'PROCESSING_BY_SKYVERN': return 'Processing';
    case 'REQUIRES_ATTENTION_USER_INPUT': return 'Action Required';
    case 'FAILED_SKYVERN_SUBMISSION': return 'Failed';
    case 'INTERVIEW_SCHEDULED': return 'Interview';
    case 'OFFER_RECEIVED': return 'Offer Received';
    case 'REJECTED_BY_COMPANY': return 'Rejected';
    default: return status.replace(/_/g, ' ').toLowerCase();
  }
};

// Helper function to get status color
const getStatusColor = (status: ApplicationStatus, colors: any) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return colors.success;
    case 'PROCESSING_BY_SKYVERN': return colors.warning;
    case 'REQUIRES_ATTENTION_USER_INPUT': return colors.warning;
    case 'FAILED_SKYVERN_SUBMISSION': return colors.error;
    case 'INTERVIEW_SCHEDULED': return '#4A90E2'; // Blue
    case 'OFFER_RECEIVED': return '#8E44AD'; // Purple
    case 'REJECTED_BY_COMPANY': return colors.error;
    default: return colors.text;
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ApplicationCard = ({ application }: { application: Application }) => {
  const colors = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'card');
  const statusColor = getStatusColor(application.status, {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    text: colors
  });
  
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to application details screen
    router.push({
      pathname: "/application-details",
      params: { id: application.id }
    });
    
    console.log('application_card_viewed_from_list', { application_id: application.id });
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <ThemedText style={styles.jobTitle} numberOfLines={1}>
          {application.job_title || 'Unknown Position'}
        </ThemedText>
        <ThemedText style={[styles.status, { color: statusColor }]}>
          {getStatusText(application.status)}
        </ThemedText>
      </View>
      
      <ThemedText style={styles.company} numberOfLines={1}>
        {application.company_name || 'Unknown Company'}
      </ThemedText>
      
      <View style={styles.footer}>
        <ThemedText style={styles.date}>
          {formatDate(application.created_at || '')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default function ApplicationsScreen() {
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'tint');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load applications on mount and when user changes
  useEffect(() => {
    loadApplications();
    console.log('applications_tab_viewed');
  }, [user]);
  
  const loadApplications = async () => {
    if (!user?.id) return;
    
    try {
      const data = await getUserApplications(user.id);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };
  
  const handleExploreJobs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/explore');
    console.log('empty_applications_explore_jobs_tapped');
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyStateText}>
        You haven't applied to any jobs yet.
      </ThemedText>
      <TouchableOpacity 
        style={[styles.emptyStateButton, { backgroundColor: primaryColor }]}
        onPress={handleExploreJobs}
      >
        <ThemedText style={styles.emptyStateButtonText}>Start Searching</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (isLoading && applications.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={styles.loadingText}>Loading applications...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'My Applications' }} />
      
      {/* Future enhancement: Add filter/sort options here */}
      
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => <ApplicationCard application={item} />}
          contentContainerStyle={styles.list}
          refreshing={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
  },
  company: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});