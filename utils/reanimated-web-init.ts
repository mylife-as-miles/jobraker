// Import polyfill first to setup necessary globals
import '@/utils/browserPolyfill';

// Add a console log to confirm the polyfill is loaded and proc is defined
if (process.env.NODE_ENV === 'development') {
  const globalObj = typeof window !== 'undefined' ? window : 
                    typeof global !== 'undefined' ? global : 
                    typeof self !== 'undefined' ? self : {};
  
  console.log('[Reanimated Web Init] proc function is', 
    typeof globalObj.proc === 'function' ? 'defined' : 'NOT defined');
}

// Import Reanimated after polyfill is loaded
import 'react-native-reanimated';

// Export to ensure it's included in the bundle
export default {};
