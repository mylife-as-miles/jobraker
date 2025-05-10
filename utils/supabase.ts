import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';
import { customStorage } from './customStorage';

// Get Supabase URL and anon key from environment variables or Constants
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  'https://your-project.supabase.co'; // Replace with your Supabase URL in production

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  'your-anon-key'; // Replace with your Supabase anon key in production

// Create Supabase client with cross-platform storage solution
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to set Supabase JWT token from Clerk
export const setSupabaseToken = async (token: string | null) => {
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    return true;
  }
  
  return false;
};