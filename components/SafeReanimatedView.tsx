import React from 'react';
import { View, ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * A wrapper component that safely renders Reanimated views across platforms
 * Uses Animated.View on native platforms, and falls back to regular View on web if needed
 */
export const SafeReanimatedView: React.FC<ViewProps & { children: React.ReactNode }> = (props) => {
  // Use regular View as a fallback on web if we encounter issues with Reanimated
  try {
    return <Animated.View {...props} />;
  } catch (error) {
    console.warn('Error using Reanimated.View, falling back to regular View:', error);
    return <View {...props}>{props.children}</View>;
  }
};

export default SafeReanimatedView;
