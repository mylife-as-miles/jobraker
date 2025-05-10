import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Cross-platform storage utility that wraps AsyncStorage for native
 * platforms and uses localStorage for web.
 * 
 * This can be used as a drop-in replacement for AsyncStorage throughout the app.
 */

class CrossPlatformAsyncStorage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    if (Platform.OS === 'web') {
      return keys.map(key => [key, localStorage.getItem(key)]);
    }
    const result = await AsyncStorage.multiGet(keys);
    // Convert the readonly array to a mutable array with the correct type
    return [...result.map(([key, value]) => [key, value] as [string, string | null])];
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    if (Platform.OS === 'web') {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      return;
    }
    return AsyncStorage.multiSet(keyValuePairs);
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      return;
    }
    return AsyncStorage.multiRemove(keys);
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.clear();
      return;
    }
    return AsyncStorage.clear();
  }

  async getAllKeys(): Promise<string[]> {
    if (Platform.OS === 'web') {
      return Object.keys(localStorage);
    }
    const keys = await AsyncStorage.getAllKeys();
    return [...keys]; // Convert readonly array to mutable array
  }
}

// Export a singleton instance
const crossPlatformStorage = new CrossPlatformAsyncStorage();
export default crossPlatformStorage;
