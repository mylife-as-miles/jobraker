# Jobraker Technology Stack & Key Libraries

**Version:** 2.0
**Last Updated:** May 7, 2025
**Status:** Live
**Owner:** Engineering Lead

## 0. Document History
| Version | Date       | Author          | Changes                                                                                                |
|---------|------------|-----------------|--------------------------------------------------------------------------------------------------------|
| 1.1     | May 7, 2025 | AI Assistant    | Initial population based on package.json and existing docs                                             |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: Verified all versions from package.json, added missing, clarified planned libraries. |

## 1. Introduction

This document outlines the core technologies, frameworks, libraries, and services that constitute the Jobraker mobile application stack. It serves as a quick reference for understanding the technical components involved in the project. This document is informed by and complements `blueprint.md`, `backend_structure.md`, and `frontend_guidelines.md`.

## 2. Frontend Technologies

### 2.1. Core Framework & Language
- **React Native:** Cross-platform mobile application development framework.
  - *Version:* `0.79.2` (from `package.json`)
- **Expo:** Framework and platform for universal React applications.
  - *Version:* `~53.0.7` (SDK 53, from `package.json`)
  - **Key Expo Modules Used (from `package.json`):**
    - `expo-router`: `~5.0.5` (File-system based routing)
    - `expo-constants`: `~17.1.5` (Accessing system and app configuration)
    - `expo-font`: `~13.3.1` (Loading custom fonts)
    - `expo-haptics`: `~14.1.4` (Providing haptic feedback)
    - `expo-linking`: `~7.1.4` (Handling deep links and opening web links)
    - `expo-splash-screen`: `~0.30.8` (Managing the app splash screen)
    - `expo-web-browser`: `~14.1.6` (For opening web links)
    - `expo-image`: `~2.1.6` (Performant image component)
    - `expo-blur`: `~14.1.4` (Component for blur effects)
    - `expo-symbols`: `~0.4.4` (SF Symbols for iOS)
    - `expo-status-bar`: `~2.2.3` (Control the status bar)
    - `expo-system-ui`: `~5.0.7` (Control system UI theming)
    - `expo-asset`: (Implicitly used by Expo, not a direct dependency in `package.json` but essential for asset management)
  - **Planned/Potential Expo Modules:**
    - `expo-secure-store`: (For secure storage of sensitive data like auth tokens)
    - `expo-document-picker`: (For selecting files e.g., resumes)
- **TypeScript:** Primary programming language for type safety and improved developer experience.
  - *Version:* `~5.8.3` (from `package.json`)

### 2.2. UI & Styling
- **NativeWind:** Utility-first styling for React Native (Tailwind CSS for React Native).
  - *Version:* (Not yet in `package.json` - Planned)
  - *Associated Dev Dependency:* `tailwindcss` (Will be added when NativeWind is integrated)
- **React Native Reanimated:** Library for creating smooth animations and interactions.
  - *Version:* `~3.17.4` (from `package.json`)
- **React Native Gesture Handler:** Native gesture handling for touch interactions.
  - *Version:* `~2.24.0` (from `package.json`)
- **`@expo/vector-icons`:** Library for icons.
  - *Version:* `^14.1.0` (from `package.json`)
- **Planned/Potential UI Libraries:**
  - `react-native-chart-kit`: For rendering charts in the analytics dashboard.

### 2.3. State Management
- **React Hooks:** (`useState`, `useReducer`, `useContext`) for local and shared component state.
- **Planned/Potential State Management Libraries:**
  - `@clerk/clerk-expo`: For authentication state management.
  - `Zustand`: Lightweight global state management library, if Context API becomes insufficient.

### 2.4. Navigation
- **Expo Router:** File-system based routing solution for Expo applications.
  - *Version:* `~5.0.5` (from `package.json`)
- **React Navigation (Core dependencies from `package.json`):**
  - `@react-navigation/native`: `^7.1.6`
  - `@react-navigation/bottom-tabs`: `^7.3.10`
  - `@react-navigation/elements`: `^2.3.8`
  - `react-native-safe-area-context`: `5.4.0`
  - `react-native-screens`: `~4.10.0`

### 2.5. API Communication
- **Planned/Potential API Communication Libraries:**
  - `axios`: Promise-based HTTP client for making requests to Adzuna and Skyvern (potentially proxied via Supabase Edge Functions).
  - `@supabase/supabase-js`: Official JavaScript client for interacting with Supabase.

### 2.6. Linting & Formatting
- **ESLint:** Pluggable JavaScript linter.
  - *Version:* `^9.25.0` (from `package.json`)
  - *Configuration:* `eslint.config.js`, `eslint-config-expo` (`~9.2.0` from `package.json`).
- **Prettier:** Code formatter.
  - *Integration:* Managed via ESLint plugins (`eslint-plugin-prettier`, `eslint-config-prettier` - not explicitly in `package.json` but part of ESLint setup if used).

### 2.7. Testing
- **Planned/Potential Testing Libraries (to be added to `devDependencies`):**
  - `jest`: JavaScript testing framework.
  - `jest-expo`: Preset for Jest with Expo.
  - `@types/jest`: TypeScript definitions for Jest.
  - `react-native-testing-library`: Utilities for testing React Native components.
*(Note: Testing libraries are not currently listed in `devDependencies` in `package.json` as of May 7, 2025. Configuration is pending.)*

## 3. Backend Technologies

### 3.1. Backend-as-a-Service (BaaS)
- **Supabase:** Open-source Firebase alternative.
  - **Database:** PostgreSQL.
  - **Authentication:** Integrated with Clerk (JWT-based).
  - **Storage:** For user file uploads (e.g., resumes).
  - **Realtime:** For live updates (e.g., application status changes).
  - **Edge Functions (Deno):** For server-side logic (e.g., API key masking, webhooks).

### 3.2. Authentication Service
- **Clerk:** User management and authentication platform.
  - *SDK:* `@clerk/clerk-expo` for frontend integration (Planned - version to be added to `package.json`).
  - *Features:* Email/password, social logins (Google, LinkedIn), JWT management.

## 4. Third-Party Services & APIs

### 4.1. Job Aggregation
- **Adzuna API:** For searching and retrieving job listings.

### 4.2. Application Automation
- **Skyvern API:** For automating the submission of job applications.

## 5. Development & Operations (DevOps)

### 5.1. Version Control
- **Git:** Distributed version control system.
- **GitHub (or similar):** Platform for hosting Git repositories, collaboration, and CI/CD.

### 5.2. Build & Deployment
- **Expo Application Services (EAS):**
  - `EAS Build`: For creating native builds (iOS/Android).
  - `EAS Submit`: For submitting apps to stores.
  - `EAS Update`: For Over-The-Air (OTA) updates.

### 5.3. CI/CD
- **GitHub Actions (or similar, e.g., GitLab CI, Jenkins):** For automating testing, linting, building, and deployment pipelines.

### 5.4. Environment Management
- **`expo-dotenv` (Potential):** For managing environment variables within the Expo app (Not yet in `package.json` - Planned).
- **EAS Build Profiles:** For managing environment-specific configurations during builds.
- **Supabase Environment Variables:** For Edge Functions and backend configurations.

## 6. Monitoring & Logging

### 6.1. Frontend
- **Sentry/Bugsnag (or Expo's default error reporting):** For error tracking and crash reporting.
- **Expo Analytics/Amplitude/Mixpanel (Potential):** For user behavior analytics.

### 6.2. Backend (Supabase)
- **Supabase Dashboard:** Built-in monitoring for API usage, database performance, and Edge Function logs.
- **Logflare (or similar):** Potential integration for advanced log management.

## 7. Documentation & Project Management

- **Markdown:** For documentation (`.md` files in `implemention_docs/`).
- **Mermaid.js:** For diagrams within Markdown (e.g., in `blueprint.md`).
- **Project Management Tool (e.g., Jira, Trello, Asana, GitHub Issues):** (Specify tool used by the team).

## 8. Key `package.json` Dependencies (as of May 7, 2025)

This section reflects the actual versions from the project's `package.json`.

```json
{
  "name": "jobraker",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "dependencies": {
    "@expo/ngrok": "^4.1.3",
    "@expo/vector-icons": "^14.1.0",
    "@react-navigation/bottom-tabs": "^7.3.10",
    "@react-navigation/elements": "^2.3.8",
    "@react-navigation/native": "^7.1.6",
    "expo": "~53.0.7",
    "expo-blur": "~14.1.4",
    "expo-constants": "~17.1.5",
    "expo-font": "~13.3.1",
    "expo-haptics": "~14.1.4",
    "expo-image": "~2.1.6",
    "expo-linking": "~7.1.4",
    "expo-router": "~5.0.5",
    "expo-splash-screen": "~0.30.8",
    "expo-status-bar": "~2.2.3",
    "expo-symbols": "~0.4.4",
    "expo-system-ui": "~5.0.7",
    "expo-web-browser": "~14.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-native": "0.79.2",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-reanimated": "~3.17.4",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "~4.10.0",
    "react-native-web": "~0.20.0",
    "react-native-webview": "13.13.5"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~19.0.10",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~9.2.0",
    "typescript": "~5.8.3"
  }
  // Planned/Potential additions based on documentation:
  // Dependencies: @clerk/clerk-expo, @supabase/supabase-js, axios, nativewind, react-native-chart-kit, expo-secure-store, expo-document-picker, expo-dotenv
  // DevDependencies: jest, jest-expo, @types/jest, react-native-testing-library, tailwindcss (for nativewind)
}
```

*(Note: The JSON block above is based on `package.json` content as of May 7, 2025. Comments indicate libraries discussed in documentation but not yet present or explicitly planned for addition.)*
