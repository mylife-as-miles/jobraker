import { supabase } from '../utils/supabase';

// Types
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  resume_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_job_titles?: string[];
  target_locations?: any;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  employment_types?: string[];
  industries?: string[];
  key_skills?: string[];
  work_arrangement?: string[];
  receive_job_alerts?: boolean;
  alert_frequency?: string;
  updated_at?: string;
}

// Create or update a user profile
export const upsertUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};

// Fetch user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Fetch user preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" error code
    return data || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

// Create or update user preferences
export const upsertUserPreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user preferences:', error);
    return null;
  }
};