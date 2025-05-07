# Jobraker Technical Blueprint & System Design

**Version:** 2.0
**Last Updated:** May 7, 2025
**Status:** Draft
**Owner:** Engineering Lead
**Stakeholders:** Product Management, Design Lead, Backend Team (if separate)

## 0. Document History
| Version | Date       | Author          | Changes                                                                                                                               |
|---------|------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | Apr 25, 2025| [Previous Author] | Initial draft outlining basic architecture                                                                                              |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: detailed component breakdown, API integrations, data models, security, deployment, and modern system design structure |

## 1. Introduction

This document provides a technical blueprint for the Jobraker mobile application. It details the system architecture, technology choices, data models, API integrations, and other technical considerations necessary for the development, deployment, and maintenance of the app. It complements the `Jobraker_PRD.markdown` and `app_flow.md`.

## 2. System Architecture Overview

Jobraker employs a client-server architecture with a mobile frontend (React Native/Expo) and a Backend-as-a-Service (BaaS) platform (Supabase), augmented by third-party APIs for specialized functionalities.

### 2.1. High-Level Diagram

```mermaid
graph TD
    User[Mobile App User] -- Interacts --> MobileClient{Jobraker Mobile App (React Native/Expo)};

    MobileClient -- HTTPS/WSS --> ClerkAuth[Clerk (Authentication)];
    MobileClient -- HTTPS/WSS --> Supabase[Supabase (BaaS)];
    MobileClient -- HTTPS --> AdzunaAPI[Adzuna API (Job Listings)];
    MobileClient -- HTTPS --> SkyvernAPI[Skyvern API (Application Automation)];

    Supabase -- Manages --> UserDB[(Supabase PostgreSQL Database)];
    Supabase -- Manages --> FileStore[(Supabase Storage)];
    Supabase -- Provides --> Realtime[Supabase Realtime];

    ClerkAuth -- JWT --> Supabase; # Clerk JWTs used for Supabase RLS

    subgraph "Third-Party Services"
        ClerkAuth;
        AdzunaAPI;
        SkyvernAPI;
    end

    subgraph "Backend Infrastructure (Supabase)"
        Supabase;
        UserDB;
        FileStore;
        Realtime;
    end
```

*(This Mermaid diagram illustrates the primary components and data flows. Refer to `tech_stack.md` for specific library versions.)*

### 2.2. Components

1.  **Mobile Client (React Native/Expo):**
    *   Handles UI/UX, user interactions, local state management, and presentation logic.
    *   Communicates with backend services and third-party APIs.
    *   Manages secure storage for session tokens.
    *   Platform: iOS & Android.

2.  **Authentication Service (Clerk):**
    *   Manages user sign-up, sign-in, social logins, password reset, and JWT generation.
    *   Provides pre-built UI components for authentication flows (`@clerk/clerk-expo`).

3.  **Backend-as-a-Service (Supabase):**
    *   **Database (PostgreSQL):** Stores user profiles, application data, preferences, and Skyvern task details.
    *   **Storage:** Securely stores user-uploaded resumes.
    *   **Realtime:** Pushes real-time updates for application statuses.
    *   **Auth Integration:** Uses Clerk-generated JWTs to enforce Row Level Security (RLS) on database tables.
    *   **(Potential) Edge Functions:** For custom server-side logic if needed (e.g., API proxying, complex data aggregation not suitable for client-side).

4.  **Job Listing API (Adzuna):**
    *   Provides access to a comprehensive database of job postings.
    *   Used for job searching and fetching job details.

5.  **Application Automation API (Skyvern):**
    *   Automates the process of filling and submitting online job applications.
    *   Receives application details and user data from the mobile client (via Jobraker backend/proxy if implemented for security, or directly if Skyvern API is designed for client-side calls with appropriate security).

## 3. Frontend Architecture (React Native/Expo)

*(Refer to `frontend_guidelines.md` for coding standards and best practices.)*

### 3.1. Directory Structure (Key Areas)

*   `app/`: Expo Router file-based routing. Screen components and layouts.
    *   `(tabs)/`: Layout and screens for tab-based navigation.
    *   `_layout.tsx`: Root layout, global providers (Clerk, Theme).
*   `assets/`: Static assets like images and fonts.
*   `components/`: Reusable UI components (e.g., `ThemedText`, `Collapsible`, custom buttons, cards).
    *   `ui/`: More specific UI elements like `IconSymbol`, `TabBarBackground`.
*   `constants/`: Global constants (e.g., `Colors.ts`, API endpoints, default configurations).
*   `hooks/`: Custom React hooks (e.g., `useColorScheme`, `useThemeColor`, data fetching hooks).
*   `services/` (Proposed): Modules for API interactions (e.g., `adzunaService.ts`, `skyvernService.ts`, `supabaseService.ts`).
*   `contexts/` (Proposed): React Context API for global state management (e.g., `AuthContext`, `ProfileContext`).
*   `utils/`: Utility functions (e.g., date formatters, validation helpers).
*   `navigation/` (If not solely relying on Expo Router for complex flows): Custom navigators or configurations for React Navigation.

### 3.2. State Management

*   **Local Component State:** `useState`, `useReducer` for individual component logic.
*   **Global State:**
    *   **Authentication State:** Managed by `@clerk/clerk-expo` and potentially an `AuthContext` for easy access to user session and profile.
    *   **User Profile & Preferences:** `UserContext` or similar, fetching data from Supabase and providing it throughout the app.
    *   **Theme State:** `useColorScheme` and `useThemeColor` for light/dark mode.
    *   **Complex Global State (Future):** Consider Zustand or Redux Toolkit if application complexity grows significantly and prop-drilling/context becomes unwieldy.

### 3.3. Navigation

*   **Framework:** Expo Router (file-system based routing).
*   **Core Navigation:** Tab-based navigation for main sections (`app/(tabs)/_layout.tsx`).
*   **Stack Navigation:** For flows within tabs (e.g., Job Details screen from Job List, Edit Profile screen from Profile tab).
*   **Modals:** For dialogs, filter options, confirmation screens.

### 3.4. API Communication

*   **HTTP Client:** Axios (or `fetch` API) for RESTful API calls to Adzuna, Skyvern, and potentially Supabase functions.
*   **Supabase Client:** `@supabase/supabase-js` for direct interaction with Supabase database, storage, and realtime features.
*   **Service Layer:** Abstract API calls into dedicated service modules (e.g., `services/jobService.ts`) to decouple components from direct API knowledge and centralize logic (error handling, request/response transformation).
*   **Error Handling:** Implement robust error handling for API requests (network errors, API errors, timeouts). Provide user-friendly feedback.
*   **Loading States:** Manage loading states effectively in UI components during API calls.

### 3.5. Local Storage

*   **Secure Storage:** `expo-secure-store` for storing sensitive data like Clerk session tokens.
*   **AsyncStorage (Expo FileSystem as alternative for larger data if needed):** For non-sensitive user preferences or cached data (e.g., recently viewed jobs - use with caution for PII).

## 4. Backend Architecture (Supabase)

### 4.1. Database Schema (PostgreSQL)

*(Simplified - detailed schema in `backend_structure.md`)*

*   **`users` Table:** (Managed by Clerk, extended by Jobraker if needed via Supabase)
    *   `id` (UUID, Primary Key, references `auth.users.id`)
    *   `clerk_user_id` (TEXT, Unique, from Clerk)
    *   `full_name` (TEXT)
    *   `email` (TEXT, Unique)
    *   `phone_number` (TEXT, nullable)
    *   `location` (TEXT, nullable)
    *   `resume_url` (TEXT, nullable, points to Supabase Storage path)
    *   `created_at` (TIMESTAMPTZ, default `now()`)
    *   `updated_at` (TIMESTAMPTZ, default `now()`)

*   **`job_preferences` Table:**
    *   `user_id` (UUID, Foreign Key to `users.id`, Primary Key)
    *   `job_titles` (TEXT[])
    *   `skills` (TEXT[])
    *   `preferred_locations` (TEXT[])
    *   `salary_expectation_min` (INTEGER, nullable)
    *   `salary_expectation_max` (INTEGER, nullable)
    *   `work_type` (ENUM: 'remote', 'on-site', 'hybrid', nullable)
    *   `updated_at` (TIMESTAMPTZ, default `now()`)

*   **`applications` Table:**
    *   `id` (UUID, Primary Key, default `gen_random_uuid()`)
    *   `user_id` (UUID, Foreign Key to `users.id`)
    *   `job_title` (TEXT)
    *   `company_name` (TEXT)
    *   `job_url` (TEXT, unique identifier for the specific job applied to)
    *   `adzuna_job_id` (TEXT, nullable, if sourced from Adzuna)
    *   `skyvern_task_id` (TEXT, nullable, from Skyvern API response)
    *   `status` (ENUM: 'pending_submission', 'processing', 'submitted', 'failed_submission', 'action_required', 'viewed', 'interviewing', 'offer', 'rejected', 'withdrawn')
    *   `applied_at` (TIMESTAMPTZ, default `now()`)
    *   `status_updated_at` (TIMESTAMPTZ, default `now()`)
    *   `notes` (TEXT, nullable)

### 4.2. Row Level Security (RLS)

*   **Crucial for data protection.**
*   Policies will be defined for each table to ensure users can only access and modify their own data.
*   Example RLS policy for `applications` table:
    ```sql
    -- Allow users to select their own applications
    CREATE POLICY "user_select_own_applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

    -- Allow users to insert their own applications
    CREATE POLICY "user_insert_own_applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Allow users to update their own applications (e.g., status, notes)
    CREATE POLICY "user_update_own_applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    ```
*   Clerk JWTs will be used by Supabase to identify the `auth.uid()`.

### 4.3. Storage (Supabase Storage)

*   Used for storing user resumes.
*   **Bucket:** `resumes`
*   **Access Controls:** Implement policies to ensure users can only upload to their designated folder (e.g., `user_id/resume.pdf`) and can only access their own files.
    *   Example Storage Policy (Conceptual - syntax may vary slightly):
        ```sql
        -- Allow authenticated users to upload to their own folder in 'resumes' bucket
        CREATE POLICY "user_upload_own_resume" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'resumes' AND name LIKE auth.uid() || '/%_resume_%');

        -- Allow authenticated users to read their own files from 'resumes' bucket
        CREATE POLICY "user_read_own_resume" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'resumes' AND owner = auth.uid());
        ```
*   File naming convention: `[user_id]/[timestamp_filename].pdf` or `[user_id]/resume_[version].pdf`.

### 4.4. Realtime (Supabase Realtime)

*   Used to push updates to the client for application status changes.
*   Client subscribes to changes on the `applications` table, filtered by `user_id`.
*   Example client-side subscription:
    ```javascript
    // In a React hook or service
    const subscription = supabase
      .channel('public:applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` }, payload => {
        console.log('Application change received!', payload);
        // Update UI or local state
      })
      .subscribe();
    ```

### 4.5. Supabase Edge Functions (Potential Use Cases)

*   **API Key Masking/Proxy:** If Adzuna or Skyvern APIs require secret keys that should not be exposed on the client, an Edge Function can act as a proxy, adding the key on the server-side before forwarding the request.
*   **Complex Queries/Aggregations:** For data processing that is too heavy for the client or involves multiple steps not easily achievable with standard Supabase client queries.
*   **Webhook Handling:** If integrating with third-party services that send webhooks (e.g., Skyvern status updates if they support webhooks).

## 5. Third-Party API Integrations

### 5.1. Clerk (Authentication)

*   **SDK:** `@clerk/clerk-expo`.
*   **Configuration:** Publishable Key stored in environment variables (`expo-dotenv`).
*   **Flow:** Client-side SDK handles UI and communication with Clerk. JWTs obtained from Clerk are sent with requests to Supabase.
*   **Supabase JWT Verification:** Supabase is configured with Clerk's JWKS URI to verify incoming JWTs.

### 5.2. Adzuna API (Job Listings)

*   **Endpoint:** `https://api.adzuna.com/v1/api/jobs/...`
*   **Authentication:** App ID and App Key in request parameters/headers.
    *   **Security:** Store these keys securely. If client-side, use environment variables. For enhanced security, proxy requests through a Supabase Edge Function.
*   **Key Operations:**
    *   Search jobs (by keywords, location, category, etc.).
    *   Get job details.
*   **Rate Limiting:** Be mindful of API rate limits. Implement client-side or server-side caching if necessary.

### 5.3. Skyvern API (Application Automation)

*   **Authentication:** API Key in request headers.
    *   **Security:** **HIGHLY RECOMMENDED** to proxy Skyvern API calls through a Supabase Edge Function. The Skyvern API key should NOT be exposed on the client, as it controls a powerful automation service and potentially handles sensitive user data during form filling.
*   **Key Operations:**
    *   Submit application task (with job URL, user data mapping).
    *   Get task status.
*   **Data Handling:** Securely transmit user profile data (resume info, contact details) required for form filling. Ensure Skyvern has strong data security and privacy policies.
*   **Error Handling:** Robustly handle various Skyvern task outcomes (success, failure, CAPTCHA required, etc.).

## 6. Security Considerations

*   **Data Encryption:** HTTPS for all API communication. Supabase encrypts data at rest.
*   **Authentication & Authorization:** Strong authentication via Clerk. Strict RLS policies in Supabase for data access control.
*   **API Key Management:** Securely store all third-party API keys. Use environment variables (`expo-dotenv`). For sensitive keys (like Skyvern's), use server-side proxies (Supabase Edge Functions).
*   **Input Validation:** Validate all user inputs on both client-side (for UX) and server-side (Supabase policies/functions, or within Edge Functions) to prevent injection attacks or malformed data.
*   **Secure Storage (Client):** Use `expo-secure-store` for session tokens.
*   **Resume Security:** Ensure Supabase Storage policies correctly restrict access to resumes.
*   **Dependency Management:** Regularly update dependencies to patch known vulnerabilities.
*   **Error Handling:** Avoid leaking sensitive information in error messages.
*   **Privacy:** Adhere to `Jobraker_PRD.markdown` privacy requirements (GDPR, CCPA). Ensure all data handling is compliant.

## 7. Scalability & Performance

*   **Frontend:**
    *   Optimize list rendering (`FlatList` with `keyExtractor`, `getItemLayout`, `removeClippedSubviews`).
    *   Code splitting (automatic with Expo Router).
    *   Memoization (`React.memo`, `useMemo`, `useCallback`).
    *   Minimize re-renders.
    *   Efficient state management.
*   **Backend (Supabase):**
    *   Proper database indexing for frequently queried columns (e.g., `user_id` in `applications`, `job_preferences`).
    *   Supabase is designed for scalability, but monitor usage and optimize queries as needed.
    *   Consider connection pooling if using Edge Functions heavily.
*   **Third-Party APIs:** Be aware of rate limits. Implement caching or request queuing if necessary.

## 8. Testing Strategy

*   **Unit Tests (Jest/React Native Testing Library):** For individual components, hooks, utility functions, and service modules.
*   **Integration Tests:** Test interactions between components, navigation, and basic API service integrations (mocked APIs).
*   **End-to-End Tests (Detox/Appium - Future Consideration):** Simulate user flows across the entire application.
*   **API Contract Testing (Pact - Future Consideration):** If backend/edge functions become complex.
*   **Linting & Formatting:** ESLint, Prettier (as per `eslint.config.js` and project setup).
*   **Manual QA:** Thorough testing of all user flows on target devices (iOS/Android).

## 9. Deployment & CI/CD

*   **Expo Application Services (EAS):**
    *   **EAS Build:** For building app binaries for iOS and Android.
    *   **EAS Submit:** For submitting builds to app stores.
    *   **EAS Update:** For publishing over-the-air (OTA) updates for JS bundles and assets.
*   **Environment Variables:** Manage different configurations (dev, staging, prod) using `.env` files and EAS Build profiles.
*   **CI/CD Pipeline (e.g., GitHub Actions, GitLab CI):**
    *   Automate linting, testing, and building on every push/merge to main branches.
    *   Automate EAS Build and potentially EAS Update deployments.
*   **Supabase Migrations:** Manage database schema changes using Supabase CLI and migration files. Integrate into CI/CD for automated schema deployment to different Supabase environments (dev, prod).

## 10. Monitoring & Logging

*   **Client-Side:**
    *   Error Tracking: Sentry, Bugsnag, or Expo's built-in error reporting.
    *   Analytics: Expo Analytics, Amplitude, or Mixpanel for user behavior tracking (respecting privacy).
*   **Backend (Supabase):**
    *   Supabase provides built-in logging and monitoring for database and API usage.
    *   If using Edge Functions, implement structured logging and send logs to a preferred logging service.
*   **Third-Party APIs:** Monitor usage dashboards provided by Clerk, Adzuna, and Skyvern for rate limits and errors.

## 11. Future Considerations / Technical Debt

*   **Offline Support:** Basic caching of job listings or application statuses for viewing offline.
*   **Advanced Search Capabilities:** More complex filtering/sorting, potentially using a dedicated search service if Adzuna capabilities are limiting.
*   **Microservices (if scaling beyond Supabase Edge Functions):** For highly specialized backend tasks.
*   **Internationalization (i18n) & Localization (l10n):** Structure app for easy translation and regional adaptation.
*   **Web Version:** Potential to reuse some React Native code with React Native for Web, or a separate web frontend.

## 12. Sign-off
*   **Engineering Lead:** [Name, Signature, Date]
*   **Product Lead:** [Name, Signature, Date]

*(This document is a living blueprint and will be updated as the system evolves.)*
