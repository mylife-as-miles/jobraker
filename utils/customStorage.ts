import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Custom storage implementation for Supabase that works across platforms
 * Uses AsyncStorage for native platforms and localStorage for web
 */
class CrossPlatformStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        return localStorage.getItem(key);
      } else {
        // Use AsyncStorage for native platforms
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(key, value);
      } else {
        // Use AsyncStorage for native platforms
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item to storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.removeItem(key);
      } else {
        // Use AsyncStorage for native platforms
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
}

export const customStorage = new CrossPlatformStorage();
