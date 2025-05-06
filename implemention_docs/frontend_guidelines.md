# Jobraker Frontend Development Guidelines

## 1. Introduction
This document provides guidelines and best practices for frontend development on the Jobraker mobile application using React Native and Expo.

## 2. Technology Stack
- **Framework:** React Native (Expo Managed Workflow)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Navigation:** @react-navigation
- **Authentication UI:** @clerk/clerk-expo
- **API Calls:** Axios
- **Database Interaction:** @supabase/supabase-js
- **Local Storage:** Expo SecureStore
- **Environment Variables:** Expo Dotenv
- **Charting:** react-native-chart-kit
- **File Picking:** react-native-document-picker

## 3. Project Structure
- Organize components logically (e.g., by screen, by UI element type).
- Separate UI components from business logic.
- Use the `app/(tabs)` structure as defined by Expo Router.

## 4. Component Development
- Use functional components and React Hooks.
- Prioritize reusability for common UI elements.
- Follow a consistent naming convention for components and files.
- Write clean, readable code with comments where necessary.

## 5. Styling
- Utilize NativeWind for styling with Tailwind CSS classes.
- Define a consistent theme using `constants/Colors.ts` and extend the NativeWind configuration if needed.
- Ensure responsiveness across different device sizes and orientations.

## 6. Navigation
- Implement navigation using `@react-navigation` following the structure outlined in `app_flow.md`.
- Define clear navigation paths between screens.
- Manage navigation state effectively.

## 7. State Management
- Use React's built-in state management (`useState`, `useContext`) for local component and simple global state.
- Consider a dedicated state management library (e.g., Zustand, React Query for server state) if the application grows in complexity, especially for managing data fetched from Supabase.

## 8. API Interactions
- Use Axios for making API calls to Adzuna and Skyvern.
- Handle API responses, errors, and loading states gracefully.
- Abstract API calls into dedicated service functions or hooks.
- Ensure API keys are securely loaded using `expo-dotenv`.

## 9. Data Handling
- Interact with Supabase using `@supabase/supabase-js` for fetching, inserting, updating, and deleting data.
- Implement real-time updates using Supabase subscriptions where required (e.g., Application History).
- Ensure data fetching and manipulation logic is separated from UI components.

## 10. Authentication (Clerk)
- Integrate `@clerk/clerk-expo` for user authentication flows (sign-in, sign-up, sign-out).
- Use Clerk's provided UI components where suitable.
- Securely store authentication tokens using `expo-secure-store`.

## 11. File Uploads (Resumes)
- Use `react-native-document-picker` to allow users to select resume files.
- Implement logic to upload selected files (PDF, DOCX, max 5MB) to Supabase Storage using `@supabase/supabase-js`.
- Store the returned file URL in the user's profile data in the Supabase `users` table.
- Handle file type and size validation on the frontend.

## 12. Error Handling and Validation
- Implement robust error handling for API calls, data operations, and user input.
- Provide clear feedback to the user in case of errors.
- Validate user input on forms (e.g., profile setup, job search filters).

## 13. Accessibility
- Design and implement components with accessibility in mind, following WCAG 2.1 guidelines.
- Use appropriate accessibility props (e.g., `accessibilityLabel`, `accessibilityRole`).
- Ensure sufficient color contrast and readable font sizes.

## 14. Performance Optimization
- Optimize list rendering using `FlatList` (or `SectionList`) with proper `keyExtractor` and virtualization.
- Minimize re-renders using `useMemo` and `useCallback`.
- Implement loading indicators for asynchronous operations (e.g., API calls, file uploads).
- Consider caching strategies for frequently accessed data (e.g., job listings).

## 15. Testing
- Write unit tests for components and utility functions using Jest.
- Implement end-to-end tests using Detox for critical user flows.
- Aim for good test coverage to ensure code quality and prevent regressions.
