# Jobraker Technical Stack Specification

## 1. Introduction
This document provides a comprehensive specification of the technology stack selected for the development and deployment of the Jobraker mobile application. The choices prioritize a balance of rapid development, scalability, security, and maintainability, leveraging modern frameworks, cloud services, and specialized APIs to deliver an efficient and autonomous job application experience.

## 2. Core Technology Components

### 2.1 Frontend
-   **Framework:** React Native
    -   **Version:** 0.74.1
    -   **Environment:** Expo SDK (~51.0.8)
    -   *Rationale:* Expo provides a managed workflow that simplifies development, testing, and deployment across iOS and Android from a single codebase. It offers access to a wide range of native device APIs and services through its SDK.

### 2.2 Backend-as-a-Service (BaaS)
-   **Provider:** Supabase
    -   **Components Utilized:** PostgreSQL Database, Realtime, Authentication, Storage, Edge Functions (potential future use).
    -   *Rationale:* Supabase offers a powerful, open-source, and vertically scalable backend solution. Its PostgreSQL database provides a robust relational data store with strong support for Row Level Security (RLS). The integrated Authentication, Storage, and Realtime features further accelerate development by providing essential backend capabilities out-of-the-box.

### 2.3 Authentication
-   **Provider:** Clerk
    -   **Methodology:** JWT-based Authentication.
    -   *Rationale:* Clerk is a developer-friendly platform that provides secure and scalable user authentication and management. It offers pre-built UI components and backend services that simplify the implementation of various authentication strategies (email/password, social logins) and integrates seamlessly by issuing standard JWTs which can be verified by Supabase for RLS.

### 2.4 External APIs
-   **Job Listing API:** Adzuna API
    -   **Endpoint:** `https://api.adzuna.com/v1/api/jobs/[country code]/search/1` (using `/us/search/1` initially)
    -   *Purpose:* To provide a comprehensive and up-to-date source of job listings based on user search criteria and preferences.
-   **Automation API:** Skyvern
    -   **Purpose:** To perform AI-powered browser automation for accurately filling and submitting online job application forms on third-party websites.
    -   *Integration:* The application will send job details and user data to Skyvern to initiate automation tasks.

## 3. Key Libraries and Dependencies

### 3.1 Navigation
-   `@react-navigation/native` & stack/bottom-tabs navigators: Standard library for handling navigation within React Native applications.

### 3.2 Styling
-   `nativewind`: Enables the use of Tailwind CSS utility classes for styling React Native components, promoting rapid and consistent UI development.
    -   *Dependency:* Tailwind CSS.

### 3.3 API Communication
-   `axios`: A widely used promise-based HTTP client for making requests to the Adzuna and Skyvern APIs, and potentially custom backend endpoints if needed.

### 3.4 Supabase Client
-   `@supabase/supabase-js`: The official JavaScript client library for interacting with all Supabase services (Database, Auth, Storage, Realtime) from the React Native application.

### 3.5 Secure Local Storage
-   `expo-secure-store`: Provides a secure way to store sensitive key-value data on the device, such as authentication tokens or API keys (though `expo-dotenv` is preferred for keys bundled with the app).

### 3.6 Environment Variable Management
-   `expo-dotenv`: Loads environment variables from a `.env` file into `process.env`, crucial for managing API keys and configuration without hardcoding.

### 3.7 Data Visualization
-   `react-native-chart-kit`: Used for rendering interactive charts (e.g., Pie Chart, Line Chart) to visualize application analytics data on the frontend.

### 3.8 File Handling
-   `react-native-document-picker`: Provides an interface for the user to select files from their device's storage, specifically used for resume uploads.

## 4. Development and Operations (DevOps) Tools

### 4.1 Testing Frameworks
-   **Unit Testing:** Jest
    -   *Purpose:* For testing individual functions, components (with React Native Testing Library), and modules in isolation.
-   **End-to-End (E2E) Testing:** Detox
    -   *Purpose:* For testing the complete application flow on a simulator or real device, ensuring features work correctly from the user's perspective.

### 4.2 Continuous Integration / Continuous Deployment (CI/CD)
-   **Platform:** Expo Application Services (EAS)
    -   *Components:* EAS Build, EAS Submit, EAS Update.
    -   *Purpose:* Streamlines the process of building, submitting, and updating the React Native application for development, preview, and production environments across iOS and Android.
-   **Automation:** GitHub Actions
    -   *Purpose:* To automate workflows such as running tests, linters, and triggering EAS builds upon code commits or pull requests.

### 4.3 Code Quality and Styling
-   ESLint: For enforcing coding standards and identifying potential issues.
-   Prettier: For automatic code formatting to maintain consistency.

## 5. Infrastructure and Hosting

-   **Mobile Application Hosting:** Distributed via Apple App Store and Google Play Store (facilitated by Expo EAS).
-   **Backend Hosting:** Supabase Cloud handles hosting and scaling of the PostgreSQL database, Auth, Storage, and Realtime services.
-   **External API Hosting:** Managed by Adzuna and Skyvern respectively.

## 6. Security Practices Integrated into the Stack

-   **HTTPS:** All network communication between the mobile app and backend services/APIs is encrypted using TLS/SSL.
-   **Supabase Row Level Security (RLS):** Policies are strictly defined and enforced at the database level to ensure users can only access and modify data they own (`auth.uid()`).
-   **Supabase Storage Policies:** Access controls are configured for storage buckets to secure user-uploaded files, restricting access based on user identity.
-   **Clerk JWT Verification:** Supabase is configured to verify JWTs issued by Clerk, ensuring that requests are authenticated and associated with a valid user before applying RLS.
-   **Secure Environment Variable Management:** `expo-dotenv` is used on the frontend to inject API keys at build time, while sensitive keys (like Supabase service key for backend operations, if any) are managed securely within the Supabase environment or via backend-specific secret management if Edge Functions are used.
-   **Expo SecureStore:** Utilized for storing sensitive user data (e.g., refresh tokens) locally on the device in an encrypted manner.
-   **Input Validation:** While UI-level validation enhances user experience, critical data validation is enforced at the database level via schema constraints and RLS policies.

This detailed technical stack specification provides a clear understanding of the technologies underpinning the Jobraker application and the rationale behind their selection, supporting the development team in building a robust and professional product.
