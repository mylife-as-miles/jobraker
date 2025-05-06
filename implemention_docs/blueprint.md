# Jobraker Technical Blueprint

## 1. Executive Summary

The Jobraker mobile application is designed to revolutionize the job application process by providing job seekers with an autonomous, AI-powered platform. Leveraging a modern technology stack centered around React Native/Expo for cross-platform development, Supabase for robust backend-as-a-service capabilities (database, storage, authentication integration), and external APIs from Adzuna (job listings) and Skyvern (browser automation), Jobraker aims to streamline job search, automate application submissions, and provide insightful analytics. This blueprint outlines the technical architecture, key components, implementation strategies, and considerations for building a scalable, secure, and performant mobile application.

## 2. Product Vision and Objectives

**Vision:** To empower job seekers to efficiently find and apply for relevant jobs with minimal manual effort through intelligent automation and personalized insights.

**Objectives:**
- Develop a highly intuitive and user-friendly mobile interface on both iOS and Android platforms using Expo.
- Integrate seamlessly with the Adzuna API to provide comprehensive and up-to-date job listings.
- Utilize the Skyvern AI-powered browser automation engine to accurately and reliably fill and submit online job application forms.
- Establish a secure and scalable backend infrastructure using Supabase for user authentication, data storage, and file management.
- Implement robust security measures to protect user data and ensure privacy (GDPR/CCPA compliance).
- Provide users with valuable analytics and historical data on their application activities.
- Achieve key performance indicators related to user acquisition, engagement, application volume, and success rates.

## 3. Technology Stack

The Jobraker application is built upon a carefully selected technology stack to ensure rapid development, scalability, and maintainability.

-   **Frontend Framework:** React Native (Version 0.74.1) managed with Expo SDK (~51.0.8).
    -   *Rationale:* Enables single codebase development for iOS and Android, leveraging the Expo ecosystem for simplified development workflows, build processes, and access to native device features.
-   **Backend-as-a-Service (BaaS):** Supabase (PostgreSQL Database, Realtime, Auth, Storage, Edge Functions).
    -   *Rationale:* Provides a powerful, open-source alternative to Firebase, offering a PostgreSQL database with Row Level Security (RLS), integrated authentication, scalable file storage, and real-time capabilities, significantly accelerating backend development.
-   **Authentication:** Clerk.
    -   *Rationale:* A comprehensive user management platform offering pre-built UI components for various authentication methods (email/password, social logins), JWT generation, and user data management, simplifying the implementation of secure authentication flows.
-   **Job Listing API:** Adzuna API.
    -   *Endpoint:* `https://api.adzuna.com/v1/api/jobs`
    -   *Rationale:* Provides access to a vast database of job listings with structured data and advanced search/filtering capabilities.
-   **Automation API:** Skyvern.
    -   *Usage:* AI-powered browser automation for filling and submitting online forms.
    -   *Rationale:* Specializes in navigating complex web forms and handling dynamic elements, CAPTCHAs, and multi-page applications reliably.
-   **Key Frontend Libraries:**
    -   `@react-navigation`: For managing the application's navigation flow and stack.
    -   `axios`: A promise-based HTTP client for making API requests.
    -   `nativewind`: Integrates Tailwind CSS with React Native for streamlined, utility-first styling.
    -   `@clerk/clerk-expo`: Facilitates the integration of Clerk authentication within the Expo environment.
    -   `@supabase/supabase-js`: The official JavaScript client library for interacting with Supabase services.
    -   `expo-secure-store`: Provides a secure way to store sensitive data like API keys and tokens on the device.
    -   `expo-dotenv`: Loads environment variables from a `.env` file into the application.
    -   `react-native-chart-kit`: Used for rendering charts to visualize application analytics data.
    -   `react-native-document-picker`: Enables users to select document files (resumes) from their device storage.

## 4. Architecture Design

The Jobraker architecture follows a client-server model with a mobile frontend consuming services from a BaaS and external APIs.

-   **Client (Mobile App):** Built with React Native/Expo, responsible for the user interface, user interaction, local state management, and initiating requests to the backend and external APIs.
-   **Backend (Supabase):** Acts as the central data repository and provides core backend services.
    -   **Database:** Stores structured data like user profiles, preferences, and application history.
    -   **Authentication:** Managed by Supabase Auth, integrated with Clerk via JWT verification. Handles user sessions and enforces RLS.
    -   **Storage:** Stores unstructured data, specifically user resume files. Access controlled by Storage policies.
    -   **Realtime:** Provides real-time updates for application statuses.
    -   **Edge Functions (Potential Future Use):** Could be used for specific backend logic or proxying external API calls.
-   **External APIs:**
    -   **Adzuna:** Provides job listing data upon request from the client (potentially proxied).
    -   **Skyvern:** Receives application requests and user data to perform automated form submissions. Communicates status updates (ideally via webhooks to Supabase or a dedicated backend endpoint).

```
[Mobile App (React Native/Expo)]
      |
      | (HTTPS)
      V
+-------------------+     +-----------------+     +-----------------+
|   Supabase BaaS   | <-> |   Adzuna API    | <-> |   Skyvern API   |
| (Database, Auth,  |     | (Job Listings)  |     | (Automation)    |
|     Storage)      |     +-----------------+     +-----------------+
+-------------------+
      ^
      | (JWT for Auth/RLS)
      |
+-------------------+
|    Clerk Auth     |
| (User Management) |
+-------------------+
```

## 5. Data Models

The core data entities within the Supabase database are:

-   **`users` Table:**
    -   `id` (UUID, Primary Key, linked to Clerk user ID)
    -   `created_at` (Timestamp)
    -   `updated_at` (Timestamp)
    -   `name` (Text)
    -   `email` (Text, Unique)
    -   `phone` (Text, Optional)
    -   `resume_url` (Text, Optional, URL to Supabase Storage)
    -   `preferred_job_title` (Text, Optional)
    -   `location` (Text, Optional)
    -   `salary_min` (Integer, Optional)
    -   `salary_max` (Integer, Optional)
    -   `remote_preference` (Text, Enum: 'yes', 'no', 'hybrid', 'any', Optional)
    -   `industry` (Text, Optional)
    -   *Row Level Security:* Policies configured to allow `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations only for the authenticated user (`auth.uid()`).

-   **`applications` Table:**
    -   `id` (UUID, Primary Key)
    -   `created_at` (Timestamp)
    -   `user_id` (UUID, Foreign Key to `users.id`, NOT NULL)
    -   `job_id` (Text, Identifier for the job, e.g., Adzuna ID, NOT NULL)
    -   `company_name` (Text, Optional)
    -   `job_title` (Text, Optional)
    -   `skyvern_task_id` (Text, Unique, ID returned by Skyvern)
    -   `status` (Text, Enum: 'Pending', 'Submitted', 'Failed', 'Processing', NOT NULL)
    -   `application_date` (Timestamp, Defaults to `created_at`)
    -   *Row Level Security:* Policies configured to allow `SELECT`, `INSERT`, `UPDATE` operations only for applications belonging to the authenticated user (`auth.uid() = user_id`).

## 6. Key Feature Implementation Details

-   **User Authentication:** Implement sign-in, sign-up, and sign-out using `@clerk/clerk-expo` components. Handle the JWT returned by Clerk and provide it to the Supabase client for authentication and RLS enforcement. Securely store the session token using `expo-secure-store`.
-   **Profile Management:** Create forms for users to input and update their personal information and job preferences. Use `@supabase/supabase-js` to write data to the `users` table. Implement data validation on the frontend before saving.
-   **Resume File Uploads:** Utilize `react-native-document-picker` to allow users to select PDF or DOCX files (max 5MB). Use the Supabase Storage SDK to upload the selected file to a designated bucket (e.g., `resumes`). Store the public or signed URL of the uploaded file in the `resume_url` field of the `users` table. Implement frontend validation for file type and size.
-   **Job Search:** Construct API requests to the Adzuna API (`/us/search/1`) using Axios, incorporating user search terms and preferences (job title, location, salary range, remote, industry) as query parameters. Handle API responses, display job listings in a performant list (`FlatList`), and implement filtering/sorting logic based on Adzuna's capabilities. Consider caching recent search results.
-   **Application Automation:** On user action (e.g., tapping an "Apply" button), trigger a process that calls the Skyvern API. The request payload should include the job posting URL (`redirect_url` from Adzuna data) and relevant user data required for form filling (retrieved from the `users` table, including the `resume_url`). Store the returned `skyvern_task_id` and an initial status (e.g., 'Pending' or 'Processing') in the `applications` table via the Supabase client. Implement a mechanism to receive status updates from Skyvern (ideally webhooks, otherwise periodic polling of the Skyvern API or checking the `applications` table) and update the `status` field in the `applications` table. Provide clear UI feedback during the automation process.
-   **Application History:** Fetch application records from the `applications` table in Supabase for the authenticated user. Display the history in a list, including job title, company, status, and date. Implement real-time updates using Supabase subscriptions to reflect status changes promptly. Add filtering by status.
-   **Analytics Dashboard:** Query the `applications` table to retrieve data necessary for analytics (total applications, statuses, dates). Use `react-native-chart-kit` to visualize this data, e.g., a pie chart for status distribution and a line chart for applications over time. Implement time range filtering (e.g., 7 days, 30 days, all time).

## 7. Non-Functional Requirements

-   **Performance:**
    -   Job search results loading time: Target < 2 seconds.
    -   Application submission initiation time: Target < 1 second (time to send request to Skyvern and update Supabase).
    -   Resume upload time: Target < 5 seconds for files up to 5MB under normal network conditions.
    -   Smooth scrolling for job lists and application history.
-   **Scalability:**
    -   Architecture designed to handle 10,000 active users.
    -   Support for 1,000 daily automated job applications.
    -   Supabase and Clerk are managed services capable of scaling with user growth.
    -   Supabase Storage configured to handle anticipated daily upload volume (e.g., 100MB).
-   **Availability:**
    -   Target 99.9% uptime, relying on the availability of managed services (Supabase, Clerk, Adzuna, Skyvern).
    -   Implement retry mechanisms for external API calls.
-   **Security:**
    -   Compliance with GDPR/CCPA data privacy regulations.
    -   All data transmission via HTTPS.
    -   Sensitive data encrypted at rest in Supabase.
    -   API keys and secrets managed securely using environment variables (`expo-dotenv` on frontend, secure configuration on backend/Supabase).
    -   Strict RLS policies in Supabase.
    -   Robust Supabase Storage policies.
    -   Secure handling of user credentials via Clerk.
    -   Input validation on both frontend and implicitly through database constraints/RLS.
-   **Accessibility:**
    -   Adherence to WCAG 2.1 guidelines (AA level where feasible).
    -   Proper use of accessibility labels, roles, and hints.
    -   Ensuring sufficient color contrast and scalable font sizes.
    -   Keyboard navigation support (where applicable in a mobile context).
-   **Maintainability:**
    -   Clean, modular codebase following React Native best practices.
    -   Comprehensive documentation (this suite of documents).
    -   Automated testing (unit and E2E).
    -   Consistent coding style (ESLint, Prettier).

## 8. Security Considerations in Detail

-   **Authentication and Authorization:** Clerk handles user authentication and issues JWTs. These JWTs are passed to Supabase. Supabase is configured to verify these JWTs and extract the `user_id`. This `user_id` is then used in RLS policies to authorize database operations, ensuring users can only access/modify their own data.
-   **Data Encryption:** Supabase encrypts data at rest. HTTPS is used for all data in transit between the mobile app, Supabase, and external APIs. `expo-secure-store` is used for secure encryption of sensitive data stored locally on the device.
-   **Supabase Row Level Security (RLS):** RLS is a critical security layer. Policies will be defined for the `users` and `applications` tables to restrict read, write, update, and delete operations based on the `auth.uid()` function, ensuring that a user can only interact with rows where their user ID matches the record's user ID.
    -   *Example RLS Policy (SELECT on `users` table):* `(auth.uid() = id)`
    -   *Example RLS Policy (INSERT on `applications` table):* `(auth.uid() = user_id)`
-   **Supabase Storage Policies:** Policies will be set up for the storage bucket (e.g., `resumes`) to control file uploads and downloads. Policies will ensure that users can only upload files to a specific path related to their user ID and can only download files from paths related to their user ID.
    -   *Example Storage Policy (INSERT into `resumes` bucket):* `(storage.foldername(name) = auth.uid()::text)` (Ensuring files are uploaded to a folder named after the user's ID)
    -   *Example Storage Policy (SELECT from `resumes` bucket):* `(storage.foldername(name) = auth.uid()::text)` (Ensuring users can only download from their own folder)
-   **API Key Management:** Adzuna and Skyvern API keys, and the Supabase service key (if used server-side, though the client-side anon key is sufficient for RLS-protected operations from the app), must be stored securely. On the frontend, `expo-dotenv` loads these into the app environment, but for maximum security, sensitive operations could be routed through Supabase Edge Functions or a separate backend service where keys are managed more securely.
-   **Input Validation:** While RLS and database constraints provide backend validation, frontend validation improves user experience. However, all critical validation (e.g., ensuring `user_id` consistency on inserts/updates) must be enforced via RLS or backend logic.

## 9. Key Performance Indicators (KPIs)

Monitoring these KPIs will be crucial for evaluating the success and performance of Jobraker post-launch:

-   **User Acquisition:**
    -   Metric: Number of new sign-ups (tracked via Clerk).
    -   Target: 1,000 registered users within 3 months.
-   **User Engagement:**
    -   Metric: Daily Active Users (DAU), Session duration, Feature usage (search, apply, view analytics) (tracked via analytics platform like Mixpanel or similar).
    -   Target: 500 DAU within 3 months.
-   **Application Volume:**
    -   Metric: Number of automated applications submitted via Skyvern (tracked via `applications` table count).
    -   Target: 5,000 automated applications submitted in 3 months.
-   **Resume Uploads:**
    -   Metric: Percentage of active users with a resume file URL stored in their profile (tracked via `users` table analysis).
    -   Target: 80% of users upload a resume within 3 months.
-   **Filter Usage:**
    -   Metric: Percentage of job searches that utilize advanced filters (salary, remote, industry) (tracked via analytics or Adzuna query logs if accessible).
    -   Target: 50% of job searches use advanced filters.
-   **Analytics Engagement:**
    -   Metric: Percentage of weekly active users who visit the Analytics screen (tracked via analytics platform).
    -   Target: 30% of weekly active users view the Analytics screen.
-   **User Retention:**
    -   Metric: User retention rate (e.g., percentage of users returning within 30 days) (tracked via analytics platform).
    -   Target: 60% retention rate within the first 3 months.
-   **Application Success Rate:**
    -   Metric: Percentage of Skyvern tasks that reach 'Submitted' status (`status = 'Submitted'` in `applications` table).
    -   Target: 80% success rate for automated applications.

## 10. Development Phases and Timeline

Subject to detailed sprint planning, the development is anticipated to follow these phases:

-   **Phase 1: Foundation & Core Features (Approx. 8 weeks)**
    -   Week 1-2: Project setup (Expo, NativeWind, Clerk, Supabase integration), basic navigation, core UI structure, Authentication flow implementation.
    -   Week 3-4: Supabase schema design (`users`, `applications`), RLS and Storage policy configuration, Profile Setup screen development (including basic data saving).
    -   Week 5-6: Adzuna API integration for job search, displaying results, basic filtering UI. Resume upload implementation using `react-native-document-picker` and Supabase Storage.
    -   Week 7-8: Skyvern API integration for application automation initiation, saving `skyvern_task_id` and initial status. Application History screen (displaying status from Supabase). Basic error handling and testing setup (Jest).
-   **Phase 2: Advanced Features & Refinement (Approx. 3 weeks)**
    -   Week 9-10: Implement real-time status updates for applications (Supabase subscriptions). Develop Analytics screen with charts (`react-native-chart-kit`). Refine UI/UX based on initial testing. Implement advanced job filters.
    -   Week 11: Comprehensive testing (unit, integration, E2E with Detox), bug fixing, performance profiling, accessibility review. Final security audit.
-   **Phase 3: Beta Testing & Deployment (Approx. 2 weeks)**
    -   Week 12: Internal beta testing, gather user feedback. Address critical issues.
    -   Week 13: Prepare for deployment using Expo EAS. Final testing and submission to App Stores.
-   **Total Estimated Timeline:** Approximately 13 weeks from project kickoff to public launch.

## 11. Risks and Mitigation Strategies

-   **Adzuna API Rate Limits:**
    -   *Risk:* Exceeding API request limits resulting in blocked job searches.
    -   *Mitigation:* Implement client-side search request debouncing. Cache job listings in Supabase (with TTL) to reduce direct Adzuna calls for repeated searches. Implement retry logic with exponential backoff for API errors.
-   **Skyvern Failure on Complex Forms:**
    -   *Risk:* Skyvern's AI failing to correctly parse or submit complex or dynamic job application forms on third-party websites.
    -   *Mitigation:* Utilize Skyvern's diagnostic tools to identify failure points. Refine the data sent to Skyvern. Provide manual application fallback options for users. Monitor Skyvern's success rate (`applications` table status) and alert on significant drops.
-   **Job Boards Blocking Automation:**
    -   *Risk:* Detection and blocking of automated application submissions by job board websites.
    -   *Mitigation:* Review terms of service of common job boards. Leverage Skyvern's built-in anti-detection features. Provide users with clear warnings about the potential for automation to be detected. Implement strategies to slow down application submission rates if necessary.
-   **Supabase/Clerk Service Downtime:**
    -   *Risk:* Unavailability of critical backend services impacting app functionality.
    -   *Mitigation:* Rely on the high availability of managed services. Implement offline mode for certain features (e.g., viewing cached job listings, drafting applications) using local storage (`AsyncStorage`). Implement robust error handling and user notifications during service disruptions.
-   **Large Resume Files Impacting Uploads:**
    -   *Risk:* Slow upload times or failures due to large resume file sizes.
    -   *Mitigation:* Enforce a strict file size limit (5MB as per PRD). Optimize Supabase Storage configuration. Provide visual feedback during uploads. Consider background upload services for larger files in future iterations.
-   **Data Privacy and Security Breaches:**
    -   *Risk:* Unauthorized access to user data or files.
    -   *Mitigation:* Continuous review and enforcement of RLS and Storage policies. Regular security audits. Keeping dependencies updated. Secure management of API keys. Educating users on strong password practices.

## 12. Future Enhancements

Following the initial launch, the following features are candidates for future development:

-   Integration with professional networking sites (e.g., LinkedIn) for profile and resume import.
-   Expansion to support job markets and APIs beyond the initial target region.
-   Implementation of an AI-driven job matching engine to provide more personalized job recommendations (potentially integrating with services like Groq for natural language processing).
-   Development of push notifications for real-time updates on application statuses or new job matches.
-   Enhanced analytics features, such as trend analysis by industry or location.
-   Support for additional resume file formats or manual resume text input/editing within the app.

This blueprint provides a detailed technical foundation for the development of the Jobraker mobile application, aligning with the product vision and objectives outlined in the PRD.
