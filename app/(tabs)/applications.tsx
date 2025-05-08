import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

// Temporary mock data until Supabase integration is complete
const MOCK_APPLICATIONS = [
  {
    id: '1',
    job_title: 'Senior React Native Developer',
    company_name: 'TechCorp Inc.',
    status: 'SUBMITTED_BY_SKYVERN',
    applied_at: new Date().toISOString(),
    last_status_update_at: new Date().toISOString(),
  },
  {
    id: '2',
    job_title: 'Frontend Engineer',
    company_name: 'StartupXYZ',
    status: 'PROCESSING_BY_SKYVERN',
    applied_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    last_status_update_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '3',
    job_title: 'Mobile Developer',
    company_name: 'Innovative Solutions',
    status: 'REQUIRES_ATTENTION_USER_INPUT',
    applied_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    last_status_update_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
];

// Helper function to get a human-readable status
const getStatusText = (status: string) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return 'Submitted';
    case 'PROCESSING_BY_SKYVERN': return 'Processing';
    case 'REQUIRES_ATTENTION_USER_INPUT': return 'Action Required';
    case 'FAILED_SKYVERN_SUBMISSION': return 'Failed';
    default: return status.replace(/_/g, ' ').toLowerCase();
  }
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'SUBMITTED_BY_SKYVERN': return colors.success;
    case 'PROCESSING_BY_SKYVERN': return colors.warning;
    case 'REQUIRES_ATTENTION_USER_INPUT': return colors.warning;
    case 'FAILED_SKYVERN_SUBMISSION': return colors.error;
    default: return colors.text;
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ApplicationCard = ({ application }: { application: any }) => {
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
    // Navigate to application details screen (to be implemented)
    router.push({ pathname: '/application-details', params: { id: application.id } });
    
    // For analytics (to be implemented with actual analytics)
    console.log('application_card_viewed_from_list', { application_id: application.id });
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor }]} onPress={handlePress}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.jobTitle} numberOfLines={1}>{application.job_title}</ThemedText>
        <ThemedText style={styles.date}>{formatDate(application.applied_at)}</ThemedText>
      </View>
      <ThemedText style={styles.company} numberOfLines={1}>{application.company_name}</ThemedText>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <ThemedText style={[styles.status, { color: statusColor }]}>
          {getStatusText(application.status)}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Future implementation: Fetch applications from Supabase
  useEffect(() => {
    // This would be replaced with actual Supabase query once integrated
    console.log('applications_tab_viewed');
  }, []);

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyStateText}>
        You haven't applied to any jobs yet.
      </ThemedText>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to Search tab
        }}
      >
        <ThemedText style={styles.emptyStateButtonText}>Start Searching</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'My Applications' }} />
      
      {/* Future enhancement: Add filter/sort options here */}
      
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ApplicationCard application={item} />}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={() => {
            setIsLoading(true);
            // Future: Fetch fresh data from Supabase
            setTimeout(() => setIsLoading(false), 1000);
          }}
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
    backgroundColor: '#007AFF', // iOS blue, can be themed with useThemeColor
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});