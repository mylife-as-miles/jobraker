import { getUserProfile, UserProfile } from '@/services/userService';
import { setSupabaseToken, supabase } from '@/utils/supabase';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

/**
 * Hook to handle Supabase authentication and provide access to the user's profile
 */
export default function useSupabase() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set the Supabase token when the user changes
  useEffect(() => {
    const setupSupabaseAuth = async () => {
      if (!user) {
        setIsLoading(false);
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Get JWT token from Clerk
        const token = await getToken({ template: 'supabase' });
        
        // Set the token in Supabase
        await setSupabaseToken(token);
        
        // Fetch user profile from Supabase
        if (user.id) {
          const userProfile = await getUserProfile(user.id);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error setting up Supabase auth:', err);
        setError('Failed to authenticate with database');
      } finally {
        setIsLoading(false);
      }
    };

    setupSupabaseAuth();
  }, [user, getToken]);

  return {
    supabase,
    profile,
    isLoading,
    error,
    refreshProfile: async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const userProfile = await getUserProfile(user.id);
          setProfile(userProfile);
        } catch (err) {
          console.error('Error refreshing profile:', err);
          setError('Failed to refresh profile');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };
}