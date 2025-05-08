import { supabase } from '../utils/supabase';

// Types
export interface Application {
  id?: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_url: string;
  adzuna_job_id?: string;
  skyvern_task_id?: string;
  status: ApplicationStatus;
  status_details?: any;
  applied_at?: string;
  last_status_update_at?: string;
  notes?: string;
  resume_url_used?: string;
  cover_letter_url_used?: string;
  application_source?: string;
  created_at?: string;
  updated_at?: string;
}

export type ApplicationStatus = 
  | 'DRAFT'
  | 'PENDING_SKYVERN_SUBMISSION'
  | 'PROCESSING_BY_SKYVERN'
  | 'SUBMITTED_BY_SKYVERN'
  | 'REQUIRES_ATTENTION_USER_INPUT'
  | 'REQUIRES_ATTENTION_MANUAL_REVIEW'
  | 'FAILED_SKYVERN_SUBMISSION'
  | 'FAILED_APPLICATION'
  | 'APPLIED_MANUALLY'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER_RECEIVED'
  | 'REJECTED_BY_COMPANY'
  | 'WITHDRAWN_BY_USER';

// Fetch all applications for a user
export const getUserApplications = async (userId: string): Promise<Application[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return [];
  }
};

// Get a specific application by ID
export const getApplicationById = async (applicationId: string): Promise<Application | null> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching application details:', error);
    return null;
  }
};

// Create a new application
export const createApplication = async (application: Omit<Application, 'id'>): Promise<Application | null> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating application:', error);
    return null;
  }
};

// Update an existing application
export const updateApplication = async (id: string, updates: Partial<Application>): Promise<Application | null> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating application:', error);
    return null;
  }
};

// Update application status
export const updateApplicationStatus = async (id: string, status: ApplicationStatus, statusDetails?: any): Promise<boolean> => {
  try {
    const updates: Partial<Application> = {
      status,
      last_status_update_at: new Date().toISOString(),
    };
    
    if (statusDetails) {
      updates.status_details = statusDetails;
    }
    
    const { error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
};

// Update application notes
export const updateApplicationNotes = async (id: string, notes: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ notes })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating application notes:', error);
    return false;
  }
};