import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * A component that safely wraps content with GestureHandlerRootView on native platforms
 * and falls back to a regular View on web to avoid gesture handler web compatibility issues
 */
export const SafeGestureView: React.FC<ViewProps> = ({ children, style, ...props }) => {
  // Use regular View on web platform
  if (Platform.OS === 'web') {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }
  
  // Use GestureHandlerRootView on native platforms
  return (
    <GestureHandlerRootView style={style} {...props}>
      {children}
    </GestureHandlerRootView>
  );
};
