# Jobraker App Flow & User Experience

**Version:** 2.1
**Last Updated:** May 7, 2025
**Status:** Revised
**Owner:** Product Management / Design Lead
**Stakeholders:** Engineering Lead, UI/UX Team, Analytics Lead

## 0. Document History

| Version | Date       | Author          | Changes                                                                                                                                  |
|---------|------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | Apr 20, 2025| [Previous Author] | Initial draft with basic screen descriptions                                                                                             |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: Detailed user flows, navigation structure, conceptual wireframes/screen descriptions, accessibility, and error handling. |
| 2.1     | May 7, 2025 | AI Assistant    | Further refinement: Granular flow details, Skyvern "Action Required" scenarios, analytics touchpoints, specific error handling examples, future enhancement notes. |

## 1. Introduction

This document outlines the user flows, navigation structure, and key screen interactions for the Jobraker mobile application. It aims to provide a clear understanding of the user experience (UX) from initial onboarding to core functionalities like job searching, application tracking, and profile management. This complements `Jobraker_PRD.markdown` (Version 2.0) and `blueprint.md`, ensuring a cohesive vision for user interaction and app behavior.

## 2. Core User Personas

*(Refer to `Jobraker_PRD.markdown` Section 1.5 for detailed personas: Alex (Recent Graduate), Maria (Mid-Career Professional), David (Senior Executive). This document focuses on their journey through the app.)*

## 3. High-Level Navigation Structure

Jobraker will utilize a tab-based navigation for its primary sections, with stack navigators for deeper content within each tab, implemented using Expo Router.

**Main Tabs (Expo Router `app/(tabs)/`):**

1.  **Home (`index.tsx`):** Personalized dashboard with quick stats, suggested jobs, and recent activity.
2.  **Search (`explore.tsx`):** Primary interface for discovering jobs via Adzuna, applying filters, and viewing detailed job descriptions.
3.  **Applications (`applications.tsx` - *new file, as proposed*):** Central hub for tracking all initiated job applications and their real-time statuses.
4.  **Profile (`profile.tsx` - *new file, as proposed*):** User account management, resume uploads, job preference settings, and app configurations.

**Authentication Flow (Managed by Clerk, typically modal or separate stack outside main tabs):**

*   Sign Up / Sign In Screens (Leveraging Clerk's pre-built UI for robustness and security).
*   Password Reset, MFA, Social Login Options (Provided by Clerk).

**Analytics Event:** `auth_flow_initiated`

## 4. Detailed User Flows & Screen Descriptions

### 4.1. Onboarding & Authentication Flow

1.  **App Launch:**
    *   **Screen:** Native Splash Screen (Managed by `expo-splash-screen`).
    *   **Action:** Application initializes. Check for existing valid Clerk session token (from Expo SecureStore).
    *   **Analytics Event:** `app_launched`
    *   **Navigation:**
        *   If valid session exists: Navigate to Home (Tab 1: `app/(tabs)/index.tsx`). **Analytics Event:** `user_session_resumed`
        *   If no valid session: Navigate to Auth Flow (e.g., `app/sign-in.tsx` or a dedicated auth stack). **Analytics Event:** `auth_required`

2.  **Authentication (Clerk UI - e.g., `app/sign-in.tsx`):**
    *   **Screens (Clerk Components):**
        *   Sign In: Email/Password, Social Logins (Google, LinkedIn).
        *   Sign Up: Email/Password, Social Logins, Name.
        *   Forgot Password flow.
        *   MFA challenge (if enabled by user).
    *   **Components:** Utilize `@clerk/clerk-expo` for `SignIn`, `SignUp` components.
    *   **Action:** User authenticates or creates a new account.
    *   **On Success:**
        *   Clerk session established. JWT obtained and securely stored.
        *   User data (ID, email, name) synced to Supabase `users` table (backend trigger on new Clerk user, as per `backend_structure.md`).
        *   **Analytics Event:** `user_signed_in` or `user_signed_up` (with `auth_method` property: email, google, linkedin).
    *   **Navigation:**
        *   If new user (identified by checking profile completeness in Supabase or a flag from Clerk): Redirect to Initial Profile Setup. **Analytics Event:** `new_user_onboarding_started`
        *   If returning user with complete profile: Redirect to Home (Tab 1).

3.  **Initial Profile Setup (Modal or Full Screen Stack - e.g., `app/onboarding/profile-setup.tsx`):**
    *   **Screen:** "Welcome to Jobraker! Let's set up your profile."
    *   **Purpose:** Gather essential information to personalize the job search and enable application automation.
    *   **Fields (Multi-step or single scrollable form):**
        *   Full Name (pre-filled if available from Clerk).
        *   Phone Number (optional).
        *   Primary Location (for job search).
        *   Resume Upload (PDF, DOCX, TXT - using `expo-document-picker`). **Analytics Event:** `resume_upload_attempted` (on selection), `resume_upload_success`/`resume_upload_failed` (on result).
        *   Key Job Preferences (e.g., desired job title, industry - simple inputs for now, advanced in Profile tab).
    *   **Action:** User provides details. Data saved to Supabase `users` and `user_preferences` tables.
    *   **Error Handling:** Inline validation for fields (e.g., valid phone format, file type/size for resume).
    *   **Navigation:** On completion or "Skip for Now" (if allowed), navigate to Home (Tab 1). **Analytics Event:** `new_user_onboarding_completed` or `new_user_onboarding_skipped`.

### 4.2. Home/Dashboard Flow (Tab 1: `app/(tabs)/index.tsx`)

*   **Screen:** Home Dashboard
*   **Purpose:** Provide a personalized overview and quick access to key app functions.
*   **Conceptual Wireframe/Layout:**
    *   Header: "Welcome, [User Name]!" or "Jobraker". Perhaps a motivational quote or tip.
    *   Section 1: **Quick Stats / Overview:** (e.g., "3 Applications Pending", "1 New Job Match for 'Software Engineer'"). (Consider using `react-native-chart-kit` for simple visual indicators). **Analytics Event:** `home_dashboard_viewed`.
    *   Section 2: **Suggested Jobs (Personalized Feed):** (Carousel or vertical list of `JobCard` components).
        *   Based on `user_preferences` and potentially recent search activity or AI recommendations (future).
        *   Each card: Job Title, Company, Location, Salary (if available), "Apply" & "Save" buttons.
        *   Tap on card navigates to Job Details screen (`app/job-details.tsx` with `jobId`). **Analytics Event:** `suggested_job_viewed`.
    *   Section 3: **Recent Application Activity:** (List of 2-3 most recent applications with concise status: "Submitted to Google", "Skyvern needs info for Meta application").
        *   Tap navigates to Application Details screen (`app/application-details.tsx` with `applicationId`). **Analytics Event:** `recent_application_viewed_from_home`.
    *   Section 4: **Quick Actions / Prompts:** (e.g., "Upload your resume to start applying!", "5 new jobs match your 'Remote Developer' saved search", "Complete your job preferences for better matches"). Links to relevant screens.
*   **Data Sources:** Supabase (`applications`, `user_preferences`, `saved_searches`), Adzuna (for suggested jobs, potentially cached in Supabase or client-side).
*   **Key Interactions:** View summaries, navigate to job/application details, respond to prompts.

### 4.3. Job Search Flow (Tab 2: `app/(tabs)/explore.tsx`)

1.  **Search Interface:**
    *   **Screen:** Job Search
    *   **Purpose:** Enable users to find relevant job openings.
    *   **Conceptual Wireframe/Layout:**
        *   Header: Prominent Search Bar (Keywords: "Job title, skills, company", Location: "City, State, Zip, or Remote").
        *   Filter Button (opens Filter Modal). Icon: `filter`. **Analytics Event:** `filter_modal_opened`.
        *   Sort Options (Dropdown/Segmented Control: Relevance, Date, Salary). **Analytics Event:** `job_search_sorted`.
        *   Results Area: List of `JobCard` components.
        *   Loading State: Skeleton loaders for `JobCard`s.
        *   Empty State: "No jobs found for your criteria. Try broadening your search."
        *   Error State: "Could not fetch jobs. Please check your connection or try again." (with a Retry button).
        *   Pagination: Infinite scroll or "Load More" button. **Analytics Event:** `job_search_paginated`.
    *   **Key Interactions:**
        *   Enter search terms. **Analytics Event:** `job_search_performed` (with properties: keywords, location, filters_applied_count).
        *   Apply/modify filters.
        *   View search results.
        *   Tap on a job card navigates to Job Details screen. **Analytics Event:** `job_card_viewed_from_search`.
    *   **API:** Adzuna API (via Supabase Edge Function for security and potential caching, as per `backend_structure.md`).

2.  **Filter Modal (`app/search/filters.tsx` - Modal):**
    *   **Screen:** Job Search Filters
    *   **Purpose:** Allow users to refine their job search.
    *   **Fields (Comprehensive, aligned with Adzuna capabilities & `Jobraker_PRD.markdown`):**
        *   Job Type (Multi-select: Full-time, Part-time, Contract, Internship, Remote - maps to Adzuna categories).
        *   Salary Range (Slider or Min/Max input fields, currency selection if multi-region).
        *   Date Posted (e.g., Last 24h, Last 3 days, Last Week, Last Month).
        *   Distance/Radius (if location is provided).
        *   Industry (Multi-select dropdown, maps to Adzuna categories).
        *   Company Name (Text input).
        *   "Must have" keywords / "Exclude" keywords.
    *   **Actions:** "Apply Filters" (updates search results), "Reset Filters", "Save Search" (prompts for name, saves to `saved_searches` table). **Analytics Event:** `filters_applied`, `filters_reset`, `search_saved`.
    *   **UI:** Use `Collapsible` components for sections if the form is long.

3.  **Job Details Screen (`app/job-details.tsx` - Pushed onto stack):**
    *   **Screen:** Job Details
    *   **Purpose:** Provide comprehensive information about a specific job.
    *   **Conceptual Wireframe/Layout:**
        *   Header: Job Title, Company Name, Location. Back button.
        *   Company Logo (fetched if available).
        *   Key Info Bar: Salary (if available), Job Type, Date Posted.
        *   Full Job Description (Scrollable `ThemedText` within a `ParallaxScrollView` if a header image/logo is prominent).
        *   "Apply with Jobraker" Button (Primary CTA). **Analytics Event:** `apply_button_tapped`.
        *   "Save Job" / "Unsave Job" Button (Icon-button: `bookmark`/`bookmark-outline`). **Analytics Event:** `job_saved`/`job_unsaved`.
        *   "View Original Post" Link (opens in `expo-web-browser`). **Analytics Event:** `original_job_post_viewed`.
        *   "Share Job" option. **Analytics Event:** `job_shared`.
    *   **Data Source:** Adzuna API (specific job details endpoint if available, or from search result data).
    *   **Key Interactions:** Read description, initiate application, save/unsave job, view original post.
    *   **Error Handling:** If job details cannot be fetched: "Job details unavailable. It might have been removed."

### 4.4. Application Tracking Flow (Tab 3: `app/(tabs)/applications.tsx`)

1.  **Applications List:**
    *   **Screen:** My Applications
    *   **Purpose:** Allow users to track the status of all their applications.
    *   **Conceptual Wireframe/Layout:**
        *   Header: "My Applications".
        *   Filter/Sort options (Dropdowns/Buttons: Status, Date Applied, Company). **Analytics Event:** `applications_filtered`/`applications_sorted`.
        *   List of `ApplicationCard` components, each showing:
            *   Job Title, Company Name.
            *   Current Status (e.g., `Submitted by Skyvern`, `Action Required: Answer custom question`, `Failed: Could not log in to portal`).
            *   Date Applied / Last Update.
        *   Visual cues for status (e.g., color-coded icons/tags: Green for success, Yellow for pending/action, Red for failure).
        *   Empty State: "You haven't applied to any jobs yet. Start searching!" with a button to Search tab.
        *   **Analytics Event:** `applications_tab_viewed`.
    *   **Data Source:** Supabase `applications` table (with Realtime updates for status changes).
    *   **Key Interactions:** View all tracked applications, filter/sort the list, tap on an application to see details. **Analytics Event:** `application_card_viewed_from_list`.

2.  **Application Details Screen (`app/application-details.tsx` - Pushed onto stack):**
    *   **Screen:** Application Details
    *   **Purpose:** Provide detailed information and history for a specific application.
    *   **Conceptual Wireframe/Layout:**
        *   Header: Job Title, Company Name. Back button.
        *   Current Status (prominently displayed with icon and description).
        *   Status History (Timeline view or chronological list of status changes with timestamps: e.g., "Pending Submission -> Submitted to Skyvern -> Processing by Skyvern -> Action Required").
        *   Skyvern Task ID (for internal reference, possibly hidden or in a debug section).
        *   **If `status` is `action_required`:**
            *   Clear description of the action needed (e.g., "Skyvern needs you to answer a custom question: 'Why are you interested in this role?'").
            *   Input field for response if applicable.
            *   "Submit Information to Skyvern" button. **Analytics Event:** `skyvern_action_required_response_submitted`.
            *   Link to "Open Job Portal Manually" if Skyvern cannot proceed.
        *   **If `status` is `failed_submission` or `failed_submission_request`:**
            *   Display `error_message` from `applications` table (e.g., "Skyvern reported: Incorrect login credentials for job portal.").
            *   "Retry Application" button (if feasible, may re-trigger Skyvern task or prompt user to check profile data). **Analytics Event:** `skyvern_application_retry_attempted`.
            *   "Apply Manually" button (links to original job post).
        *   User Notes section (editable `TextInput` for user's private notes, saved to `applications.notes`). **Analytics Event:** `application_note_saved`.
        *   Link to original Job Posting.
        *   Option to manually update status: "Mark as Interviewing", "Mark as Offer Received", "Mark as Rejected", "Withdraw Application". (Updates `applications.status` in Supabase). **Analytics Event:** `application_status_manual_update`.
    *   **Data Source:** Supabase `applications` table.
    *   **Key Interactions:** View detailed status/history, add/edit notes, respond to `action_required` prompts, manually update status.

### 4.5. Profile Management Flow (Tab 4: `app/(tabs)/profile.tsx`)

1.  **Profile View/Edit:**
    *   **Screen:** My Profile
    *   **Purpose:** Manage user account, resume, and preferences.
    *   **Conceptual Wireframe/Layout:**
        *   Header: "My Profile".
        *   User Avatar/Initials (fetched from Clerk or default).
        *   Section 1: **Personal Information** (Name, Email - from Clerk, read-only or link to Clerk profile).
            *   Phone, Location (editable, tap navigates to `app/profile/edit-personal-info.tsx`).
        *   Section 2: **Resume Management.**
            *   Displays current resume file name and upload date. "No resume uploaded" if none.
            *   "Upload/Replace Resume" button (uses `expo-document-picker`). **Analytics Event:** `profile_resume_upload_attempted`.
            *   "Delete Resume" button (with confirmation). **Analytics Event:** `profile_resume_deleted`.
        *   Section 3: **Job Preferences.**
            *   Summary of key preferences (e.g., "Desired Role: Senior Developer", "Target Salary: $120k+").
            *   "Edit Job Preferences" button (navigates to `app/profile/edit-job-preferences.tsx`). **Analytics Event:** `edit_job_preferences_opened`.
        *   Section 4: **App Settings.**
            *   Notification Preferences (navigates to `app/profile/notification-settings.tsx`).
            *   Theme (Light/Dark/System - if implemented).
            *   "Saved Searches" (navigates to a screen listing saved searches with edit/delete options).
        *   Section 5: **Account.**
            *   "Sign Out" button (triggers Clerk sign-out, clears local session, navigates to Auth flow). **Analytics Event:** `user_signed_out`.
            *   "Delete Account" button (with multiple confirmations, explains data deletion process, triggers Clerk account deletion and Supabase data anonymization/deletion). **Analytics Event:** `delete_account_initiated`.
    *   **Data Sources:** Supabase (`users`, `user_preferences`), Clerk (for auth info, sign-out, account deletion).
    *   **Key Interactions:** View profile, navigate to edit sections, manage resume, sign out, delete account.
    *   **Analytics Event:** `profile_tab_viewed`.

2.  **Edit Personal Information Screen (`app/profile/edit-personal-info.tsx` - Pushed onto stack):**
    *   **Screen:** Edit Personal Info
    *   **Fields:** Editable fields for Phone, Location.
    *   **Action:** "Save Changes" button updates Supabase `users` table. Inline validation. **Analytics Event:** `personal_info_updated`.
    *   **UI:** Clear form layout, back navigation.

3.  **Edit Job Preferences Screen (`app/profile/edit-job-preferences.tsx` - Pushed onto stack):**
    *   **Screen:** Edit Job Preferences
    *   **Fields (Comprehensive, as per `Jobraker_PRD.markdown`):**
        *   Desired Job Titles/Keywords (Tags input using a library like `react-native-tags-input`).
        *   Preferred Job Types (Checkboxes/Switches: Full-time, Part-time, Contract, Remote).
        *   Target Salary Range (Min/Max inputs or slider, currency).
        *   Willingness to Relocate (Boolean Switch).
        *   Preferred Locations (Tags input with autocomplete for cities).
        *   Preferred Industries (Multi-select dropdown with search).
    *   **Action:** "Save Preferences" button updates Supabase `user_preferences` table. **Analytics Event:** `job_preferences_updated`.
    *   **UI:** Well-structured form, potentially using `Collapsible` sections.

### 4.6. Job Application Submission Flow (Skyvern Integration)

This flow starts when the user taps "Apply with Jobraker" on the Job Details screen.

1.  **Initiate Application (Client-Side):**
    *   **Trigger:** User taps "Apply with Jobraker" on a job from Adzuna.
    *   **Action (Client-Side Logic):**
        *   Check if user has a resume in Supabase (check `users.current_resume_url`).
            *   If no resume: Alert/Modal: "Resume Required. Please upload a resume in your Profile to use automated applications." Buttons: "Go to Profile", "Cancel". If "Go to Profile", navigate to Profile tab, potentially deep-link to resume section. **Analytics Event:** `apply_failed_no_resume`.
            *   Return early if no resume.
        *   If resume exists:
            *   Create a preliminary entry in Supabase `applications` table (client-side insert for immediate UI feedback):
                *   `user_id`: Current user.
                *   `job_title`, `company_name`, `job_url` (from Adzuna data).
                *   `adzuna_job_id` (if available).
                *   `status`: `pending_skyvern_submission` (new status).
                *   `applied_at`: `now()`.
                *   `application_source`: `JOBRAKER_AUTOMATED`.
            *   Display a persistent toast or modal: "Submitting your application for [Job Title] via Skyvern..." (Non-blocking if possible, user can navigate away).
            *   **Analytics Event:** `skyvern_application_initiated` (with `job_id`, `company_name`).
            *   Call a Supabase Edge Function (`initiate-skyvern-application`) with the newly created `application.id` and necessary job/user details.

2.  **Skyvern Task Creation & Monitoring (Backend - Supabase Edge Function `initiate-skyvern-application`):**
    *   **Trigger:** Called by client with `application.id`.
    *   **Action (Backend Logic):**
        *   Retrieve full user profile and resume URL from Supabase `users` and `user_preferences` using the authenticated user ID.
        *   Retrieve job details from `applications` table using `application.id`.
        *   Call Skyvern API (`/submit_application` or similar endpoint - refer to `backend_structure.md` and Skyvern docs):
            *   Pass resume URL, job application URL, structured user data.
        *   **On Skyvern API Success (task accepted):**
            *   Update the `applications` table row for `application.id`:
                *   `skyvern_task_id`: Skyvern's returned task ID.
                *   `status`: `processing_by_skyvern`.
                *   `last_status_update_at`: `now()`.
        *   **On Skyvern API Immediate Failure (e.g., invalid parameters, Skyvern down):**
            *   Update the `applications` table row:
                *   `status`: `failed_skyvern_submission` (new status).
                *   `error_message`: "Could not initiate application with Skyvern automation service. Please try again later or apply manually."
                *   `last_status_update_at`: `now()`.
    *   The client will see status updates via Realtime subscription to the `applications` table.

3.  **Skyvern Processing & Webhooks (Backend - Supabase Edge Function `skyvern-webhook-handler`):**
    *   Skyvern processes the application asynchronously.
    *   Skyvern calls a pre-configured webhook endpoint (e.g., `https://<your-supabase-url>/functions/v1/skyvern-webhook-handler`) with updates.
    *   **Backend Action (Webhook Handler):**
        *   Validate webhook signature/source.
        *   Parse payload: `skyvern_task_id`, `new_status` (e.g., `completed_successfully`, `failed_application`, `action_required_user_input`), `details` (e.g., confirmation message, error reason, specific question for user).
        *   Find the corresponding application in `applications` table using `skyvern_task_id`.
        *   Update `status`, `error_message` (if any), and `last_status_update_at`. Store `details` if `action_required`.
        *   **Analytics Event (Server-Side):** `skyvern_status_update_received` (with `skyvern_task_id`, `new_status`).
        *   If `new_status` is `completed_successfully`, `failed_application`, or `action_required_user_input`, trigger a push notification to the user.

4.  **Application Status Updates & User Interaction (In-App):**
    *   The `Applications` tab and `ApplicationDetailsScreen` (listening to Supabase Realtime updates) will reflect status changes.
    *   Push notifications (via Expo Notifications, triggered by backend) inform user of critical updates:
        *   "Success! Your application for [Job Title] was submitted."
        *   "Problem with [Job Title] application: [Brief error from Skyvern]."
        *   "Action needed for [Job Title] application. Open app for details."
    *   **If `status` is `action_required_user_input`:**
        *   The `ApplicationDetailsScreen` will display the question/prompt from Skyvern (`applications.details`).
        *   User provides input, which is then sent back to Skyvern via another Edge Function (`respond-to-skyvern-action`). Skyvern resumes processing.
    *   **Visual Consistency:** Ensure UI updates and notifications are consistent with `frontend_guidelines.md`.

## 5. Accessibility Considerations (A11y)

*   **Semantic Elements:** Consistent use of `ThemedText` and `ThemedView` with appropriate `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` props.
*   **Contrast:** Strict adherence to WCAG AA contrast ratios (defined in `constants/Colors.ts` and verified during design reviews).
*   **Dynamic Type & Font Scaling:** Ensure UI reflows gracefully with system font size changes. Test thoroughly.
*   **Screen Reader Support:** Comprehensive testing with VoiceOver (iOS) and TalkBack (Android) for all user flows. All interactive elements must be clearly identifiable and operable.
*   **Haptic Feedback:** Meaningful use of `expo-haptics` for confirmations (e.g., successful submission, save), errors, and tab navigation (as in `HapticTab.tsx`).
*   **Keyboard Navigation:** Test for full keyboard operability if app is also intended for web/desktop targets via Expo Web.

## 6. Error Handling & Edge Cases - Enhanced

*   **Network Errors (Client-Side):**
    *   Global Axios interceptor to handle network offline errors.
    *   Display a persistent "Offline" banner or toast. Queue critical outgoing requests (e.g., application submissions) if possible using AsyncStorage for later retry when connection resumes.
    *   User-friendly messages: "No internet connection. Some features may be unavailable."
    *   Retry buttons for data fetching operations.
*   **API Errors (Adzuna, Skyvern - Handled by Supabase Edge Functions where possible):**
    *   Edge Functions return standardized error responses to the client.
    *   Client displays user-friendly messages:
        *   Adzuna: "Job search is temporarily unavailable. Please try again soon."
        *   Skyvern: "Application automation service is experiencing issues. Your application will be queued or you can try again." (if queuing is implemented).
    *   Log detailed errors in Supabase logs for backend debugging.
*   **Supabase Errors (Client-Side & Edge Functions):**
    *   Handle RLS errors (should be rare if rules are correct), data validation errors from DB.
    *   Client: "An unexpected error occurred. Please try again."
*   **Clerk Authentication Errors:**
    *   Clerk's UI components handle most common auth errors. Custom interactions with Clerk API must also handle errors like `session_expired`, `invalid_token`.
    *   Force sign-out if session becomes irrevocably invalid.
*   **Form Validation (Client-Side):**
    *   Use libraries like `react-hook-form` or `formik` for robust form handling and validation in Profile Setup, Filters, etc.
    *   Clear, specific error messages next to fields: "Valid email required", "Salary must be a number".
*   **Empty States:**
    *   All lists (job search results, applications, saved searches) must have well-designed empty state messages with clear CTAs (e.g., "No saved jobs yet. Start searching and save your favorites!").
*   **Skyvern `action_required` Scenarios:**
    *   **Custom Question:** Present question clearly, provide text input, submit back to Skyvern.
    *   **2FA/MFA:** Inform user: "This site requires 2FA. Skyvern cannot proceed automatically. Please [Open Job Portal Manually] to complete this step." (Future: explore secure ways to assist).
    *   **CAPTCHA:** Inform user: "A CAPTCHA is blocking automation. Please [Open Job Portal Manually]."
    *   **Unknown Site Structure:** "Skyvern is having trouble with this job site. You may need to [Apply Manually]."
*   **Large Data & Performance:**
    *   Virtualize long lists (`FlatList` `initialNumToRender`, `windowSize`, `getItemLayout`).
    *   Optimize image loading (`expo-image` with placeholders and caching).
    *   Memoize components (`React.memo`, `useCallback`).
    *   Monitor performance with Expo tools and Sentry.

## 7. Visual Polish and UI Elements

*   Strict adherence to `frontend_guidelines.md` and `blueprint.md` for component styling, typography, spacing, and iconography (`IconSymbol`).
*   Consistent use of `TabBarBackground`, `Collapsible`, `ParallaxScrollView` where appropriate.
*   Loading States: Use skeleton screens (e.g., `react-content-loader`) for complex views or `ActivityIndicator` for simpler loads. Ensure they are not jarring.
*   Animations & Transitions: Subtle and purposeful animations using `react-native-reanimated` to enhance UX, not distract. Test for performance.
*   **Dark Mode:** Ensure all screens and components are fully compatible and visually appealing in both light and dark themes (managed via `useColorScheme` and `Colors.ts`).

## 8. Future Flow Enhancements

*   **Multi-Resume Management Flow:** Allow users to upload, name, and select specific resumes for different applications.
*   **AI Cover Letter Generation Flow:** Integrate a step where users can opt to generate a cover letter, review, edit, and include it with the Skyvern submission.
*   **Interview Tracking Flow:** Allow users to log interview invitations, schedules, and outcomes linked to applications.
*   **Advanced Onboarding:** More interactive onboarding, perhaps with AI-driven suggestions for profile completion based on desired roles.

*(End of Document)*
