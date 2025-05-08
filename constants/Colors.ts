/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F9FAFB',
    border: '#E4E7EB',
    error: '#e53935',
    success: '#43a047',
    gradientStart: '#0a7ea4',
    gradientEnd: '#0d97c2',
    inputBackground: '#F9FAFB',
    placeholder: '#9BA1A6',
    buttonText: '#FFFFFF',
    divider: '#E4E7EB',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    highlight: '#0d97c2',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1E2021',
    border: '#303437',
    error: '#f44336',
    success: '#4caf50',
    gradientStart: '#0a7ea4',
    gradientEnd: '#0d97c2',
    inputBackground: '#1E2021',
    placeholder: '#687076',
    buttonText: '#151718',
    divider: '#303437',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    highlight: '#0d97c2',
  },
};

// Auth screen specific gradients
export const AuthGradients = {
  primary: ['#0a7ea4', '#0d97c2'],
  secondary: ['#151718', '#1E2021'],
  success: ['#43a047', '#66bb6a'],
  error: ['#e53935', '#f44336'],
};
