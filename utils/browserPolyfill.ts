/**
 * This polyfill provides mock implementations for browser-specific objects
 * when running in a Node.js environment (like during SSR) or in a web context.
 * It specifically addresses issues with react-native-reanimated and react-native-gesture-handler
 * when used in web environments.
 */

// Helper to safely access global scope across different environments
const getGlobalObject = (): any => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof global !== 'undefined') return global;
  if (typeof window !== 'undefined') return window;
  if (typeof self !== 'undefined') return self;
  return {};
};

const globalObj = getGlobalObject();

// Only apply polyfills if needed
if (typeof window === 'undefined' || typeof document === 'undefined') {
  // Basic window and document polyfills
  globalObj.window = globalObj.window || {};
  globalObj.document = globalObj.document || {
    createElement: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { style: {} },
    documentElement: { style: {} }
  };

  // Storage polyfills
  globalObj.localStorage = globalObj.localStorage || {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    key: (index: number) => null,
    length: 0
  };
  
  globalObj.sessionStorage = globalObj.sessionStorage || {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    key: (index: number) => null,
    length: 0
  };
  
  // Navigator polyfill
  globalObj.navigator = globalObj.navigator || {
    userAgent: 'polyfill',
    platform: 'polyfill',
    product: 'polyfill'
  };
}

// Gesture handler and touch event polyfills
globalObj.TouchEvent = globalObj.TouchEvent || {};
if (globalObj.window) {
  globalObj.window.TouchEvent = globalObj.window.TouchEvent || {};
  
  // Match media polyfill with proper interface implementation
  globalObj.window.matchMedia = globalObj.window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }));
  
  // HTML elements polyfills for gesture handler
  globalObj.window.HTMLElement = globalObj.window.HTMLElement || (() => {});
  globalObj.window.HTMLDivElement = globalObj.window.HTMLDivElement || { 
    prototype: { style: { touchAction: null } } 
  };
  globalObj.window.HTMLParagraphElement = globalObj.window.HTMLParagraphElement || { 
    prototype: { style: { touchAction: null } } 
  };
}

// Critical: Fix for proc function used by react-native-reanimated
// This is the key change to fix the "proc is not a function" error
if (!globalObj._workletProcessing) {
  globalObj._workletProcessing = {
    createWorkletProcessor: () => ({})
  };
}

if (!globalObj.workletFn) {
  globalObj.workletFn = function() {
    return function() {
      return undefined;
    };
  };
}

// Define and polyfill all necessary functions for react-native-reanimated
// This is a comprehensive set of polyfills for Reanimated web compatibility

// proc function - core to Reanimated worklets
if (typeof globalObj.proc !== 'function') {
  globalObj.proc = function proc(fn) {
    // Return the original function or a no-op function if input isn't a function
    return typeof fn === 'function' ? fn : () => {};
  };
}

// Make sure proc is accessible in all relevant scopes
if (typeof global !== 'undefined' && typeof global.proc !== 'function') {
  global.proc = globalObj.proc;
}

if (typeof window !== 'undefined' && typeof window.proc !== 'function') {
  window.proc = globalObj.proc;
}

// Additional Reanimated-related polyfills
// Worklet context is used by Reanimated for its internal processing
if (typeof globalObj.__reanimatedWorkletInit === 'undefined') {
  globalObj.__reanimatedWorkletInit = function(worklet) {
    return worklet;
  };
}

// Ensure makeShareable and makeMutable exist (used in Reanimated 2+)
if (typeof globalObj.makeShareable !== 'function') {
  globalObj.makeShareable = function(value) { 
    return value; 
  };
}

if (typeof globalObj.makeMutable !== 'function') {
  globalObj.makeMutable = function(value) { 
    return { value }; 
  };
}
if (typeof globalObj.proc !== 'function') {
  globalObj.proc = function() {
    return {
      __defineGetter__: function() {},
      __defineSetter__: function() {},
      then: function(resolver: Function) { resolver(); return this; }
    };
  };
}

// Environment variables for reanimated
if (typeof process !== 'undefined') {
  process.env = process.env || {};
  process.env.JEST_WORKER_ID = '1'; // To bypass reanimated web initialization checks
  process.env.EXPO_PUBLIC_ENABLE_REANIMATED_NATIVE = 'false';
}

// Add these globals that reanimated might look for
globalObj._frameTimestamp = null;
globalObj._WORKLET = true;

// Make sure window.requestAnimationFrame is available
if (typeof globalObj.requestAnimationFrame !== 'function') {
  globalObj.requestAnimationFrame = (callback: Function) => {
    return setTimeout(() => callback(Date.now()), 16);
  };
}

if (typeof globalObj.cancelAnimationFrame !== 'function') {
  globalObj.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

export { };

  export { };

