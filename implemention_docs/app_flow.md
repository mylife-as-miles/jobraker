# Jobraker App Flow & User Experience

**Version:** 2.0  
**Last Updated:** May 7, 2025  
**Status:** Draft  
**Owner:** Product Management / Design Lead  
**Stakeholders:** Engineering Lead, UI/UX Team

## 0. Document History

| Version | Date       | Author          | Changes                                                                                                                                  |
|---------|------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | Apr 20, 2025| [Previous Author] | Initial draft with basic screen descriptions                                                                                             |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: Detailed user flows, navigation structure, conceptual wireframes/screen descriptions, accessibility, and error handling. |

## 1. Introduction

This document outlines the user flows, navigation structure, and key screen interactions for the Jobraker mobile application. It aims to provide a clear understanding of the user experience (UX) from initial onboarding to core functionalities like job searching, application tracking, and profile management. This complements `Jobraker_PRD.markdown` and `blueprint.md`.

## 2. Core User Personas

*(Refer to `Jobraker_PRD.markdown` Section 3 for detailed personas: Ambitious Alex, Career-Changer Chloe, Entry-Level Evan). This document focuses on their journey through the app.)*

## 3. High-Level Navigation Structure

Jobraker will use a tab-based navigation for its primary sections, with stack navigators for deeper content within each tab.

**Main Tabs (Expo Router `app/(tabs)/`):**

1.  **Home/Dashboard (`index.tsx`):**
    *   Overview of recent activity, suggested jobs, application status summary.
2.  **Search Jobs (`explore.tsx`):**
    *   Interface for searching jobs via Adzuna, filtering, and viewing job details.
3.  **Applications (`applications.tsx` - *new file proposal*):**
    *   List of all jobs user has initiated an application for, their statuses, and history.
4.  **Profile (`profile.tsx` - *new file proposal*):**
    *   User profile details, resume management, job preferences, settings.

**Authentication Flow (Handled by Clerk, outside main tabs initially):**

*   Sign Up / Sign In Screens (Clerk pre-built UI)
*   Password Reset / Social Login Options (Clerk pre-built UI)

## 4. Detailed User Flows & Screen Descriptions

### 4.1. Onboarding & Authentication Flow

1.  **App Launch:**
    *   **Screen:** Splash Screen (`expo-splash-screen`).
    *   **Action:** Check for existing Clerk session.
    *   **Navigation:** If session exists and is valid, navigate to Home (Tab 1). If not, navigate to Auth Flow.

2.  **Authentication (Clerk UI):**
    *   **Screens:**
        *   Sign In: Email/Password, Social Logins (Google, LinkedIn).
        *   Sign Up: Email/Password, Social Logins, Name.
        *   Forgot Password.
    *   **Components:** Uses `@clerk/clerk-expo` pre-built components.
    *   **Action:** User authenticates or creates an account.
    *   **On Success:** Clerk session established. JWT obtained. User data (basic) synced to Supabase `users` table (via trigger as per `backend_structure.md`).
    *   **Navigation:** Redirect to Home (Tab 1) or to a "Complete Profile" screen if it's a first-time sign-up and profile is minimal.

3.  **Initial Profile Setup (Optional - Post Sign-Up):**
    *   **Screen:** "Complete Your Profile" (Modal or full screen).
    *   **Fields:** Location, Phone Number, Upload Resume (optional at this stage but encouraged).
    *   **Action:** User provides additional details. Data saved to Supabase `users` table.
    *   **Navigation:** To Home (Tab 1).

### 4.2. Home/Dashboard Flow (Tab 1: `index.tsx`)

*   **Screen:** Home Dashboard
*   **Conceptual Wireframe/Layout:**
    *   Header: "Welcome, [User Name]!" or "Jobraker".
    *   Section 1: **Quick Stats / Overview** (e.g., "3 Applications Pending", "1 New Job Match"). (Uses `react-native-chart-kit` for simple visuals if applicable).
    *   Section 2: **Suggested Jobs** (Carousel or list based on `job_preferences`).
        *   Each item is a `JobCard` component (see `frontend_guidelines.md`).
        *   Tap navigates to Job Details screen.
    *   Section 3: **Recent Application Activity** (List of 2-3 most recent applications with status).
        *   Tap navigates to Application Details screen.
    *   Section 4: **Quick Actions** (e.g., "Update Resume", "Refine Preferences").
*   **Data Sources:** Supabase (`applications`, `job_preferences`), Adzuna (for suggested jobs, potentially cached).
*   **Key Interactions:**
    *   View summaries.
    *   Navigate to specific job details or application details.
    *   Navigate to profile or preferences sections.

### 4.3. Job Search Flow (Tab 2: `explore.tsx`)

1.  **Search Interface:**
    *   **Screen:** Job Search
    *   **Conceptual Wireframe/Layout:**
        *   Header: Search Bar (Keywords, Location).
        *   Filter Button (opens Filter Modal).
        *   Sort Options (Dropdown: Relevance, Date).
        *   Results Area: List of `JobCard` components.
        *   Loading indicator / Empty state / Error state.
        *   Pagination (Infinite scroll or "Load More" button).
    *   **Key Interactions:**
        *   Enter search terms (keywords, location).
        *   Apply filters (Job Type, Salary Range, etc. - see 4.3.2).
        *   View search results.
        *   Tap on a job card to see details.
    *   **API:** Adzuna API.

2.  **Filter Modal:**
    *   **Screen:** Job Search Filters (Modal)
    *   **Fields:**
        *   Job Type (Full-time, Part-time, Contract, Remote - from Adzuna categories or user preferences).
        *   Salary Range (Slider or input fields).
        *   Date Posted.
        *   Distance (if location is provided).
    *   **Actions:** Apply Filters, Reset Filters, Close Modal.

3.  **Job Details Screen:**
    *   **Screen:** Job Details (Pushed onto stack from Search or Home)
    *   **Conceptual Wireframe/Layout:**
        *   Header: Job Title, Company Name, Location.
        *   Company Logo (if available).
        *   Key Info: Salary (if available), Job Type.
        *   Full Job Description (Scrollable `ThemedText`).
        *   "Apply with Jobraker" Button (CTA).
        *   "Save Job" / "View Original Post" Link (opens in `expo-web-browser`).
    *   **Data Source:** Adzuna API.
    *   **Key Interactions:**
        *   Read job description.
        *   Initiate application process (see 4.5).

### 4.4. Application Tracking Flow (Tab 3: `applications.tsx` - New)

1.  **Applications List:**
    *   **Screen:** My Applications
    *   **Conceptual Wireframe/Layout:**
        *   Header: "My Applications".
        *   Filter/Sort options (Status, Date Applied).
        *   List of applications, each showing:
            *   Job Title, Company Name.
            *   Current Status (e.g., `submitted_successfully`, `action_required`).
            *   Date Applied / Last Update.
        *   Visual cues for status (e.g., color-coded icons).
        *   Empty state if no applications.
    *   **Data Source:** Supabase `applications` table (with Realtime updates).
    *   **Key Interactions:**
        *   View all tracked applications.
        *   Filter/sort the list.
        *   Tap on an application to see details.

2.  **Application Details Screen:**
    *   **Screen:** Application Details (Pushed onto stack)
    *   **Conceptual Wireframe/Layout:**
        *   Header: Job Title, Company Name.
        *   Status History (Timeline view if possible, or list of status changes with timestamps).
        *   Current Status and Reason (if `failed_submission` or `action_required`).
        *   Skyvern Task ID (for reference, maybe not user-facing directly).
        *   Notes section (editable `TextInput` for user's private notes).
        *   Link to original Job Posting.
        *   Option to "Withdraw Application" (updates status in Supabase, does not actually withdraw from employer site unless Skyvern supports this).
        *   Option to "Mark as [Offer/Rejected/etc.]" if Skyvern cannot auto-track this far.
    *   **Data Source:** Supabase `applications` table.
    *   **Key Interactions:**
        *   View detailed status and history.
        *   Add/edit personal notes.
        *   Manually update application status if needed.

### 4.5. Profile Management Flow (Tab 4: `profile.tsx` - New)

1.  **Profile View/Edit:**
    *   **Screen:** My Profile
    *   **Conceptual Wireframe/Layout:**
        *   Header: "My Profile".
        *   User Avatar/Initials.
        *   Section 1: Personal Information (Name, Email - from Clerk, Phone, Location - editable).
            *   Edit button navigates to an "Edit Personal Info" screen.
        *   Section 2: Resume Management.
            *   Displays current resume file name (if uploaded).
            *   "Upload/Replace Resume" button (uses `expo-document-picker`).
            *   "Delete Resume" button.
        *   Section 3: Job Preferences.
            *   Key preferences (e.g., desired role, job types, salary expectation).
            *   Edit button navigates to "Edit Job Preferences" screen.
        *   Section 4: App Settings (e.g., Notifications, Theme - if implemented).
        *   Section 5: Account (e.g., "Sign Out", "Delete Account" - triggers Clerk actions and Supabase cleanup).
    *   **Data Sources:** Supabase (`users`, `job_preferences`), Clerk (for basic auth info and sign-out).
    *   **Key Interactions:**
        *   View profile details.
        *   Navigate to edit screens for different profile sections.
        *   Manage resume (upload, delete).
        *   Sign out.

2.  **Edit Personal Information Screen:**
    *   **Screen:** Edit Personal Info (Pushed onto stack)
    *   **Fields:** Editable fields for Phone, Location. Name and Email might be read-only or link to Clerk's profile management.
    *   **Action:** Save changes to Supabase `users` table.

3.  **Edit Job Preferences Screen:**
    *   **Screen:** Edit Job Preferences (Pushed onto stack)
    *   **Fields:**
        *   Desired Job Titles/Keywords (Tags input).
        *   Preferred Job Types (Checkboxes: Full-time, Part-time, Contract, Remote).
        *   Target Salary Range (Slider or input).
        *   Willingness to Relocate (Boolean).
        *   Preferred Locations (Tags input).
    *   **Action:** Save changes to Supabase `job_preferences` table.

### 4.6. Job Application Submission Flow (Skyvern Integration)

This flow starts when the user taps "Apply with Jobraker" on the Job Details screen.

1.  **Initiate Application:**
    *   **Trigger:** User taps "Apply with Jobraker" on a job from Adzuna.
    *   **Action:**
        *   App checks if user has a resume in Supabase.
            *   If no resume, prompt: "You need to upload a resume in your profile to apply. Go to Profile?" (Yes/No). If yes, navigate to Profile tab.
        *   If resume exists, create a new entry in Supabase `applications` table:
            *   `user_id`: Current user.
            *   `job_details`: Relevant details from Adzuna (title, company, Adzuna job ID, original URL).
            *   `skyvern_task_id`: Null initially.
            *   `status`: `pending_submission`.
            *   `submitted_at`: Null.
            *   `error_message`: Null.
        *   Display a loading indicator/modal: "Preparing your application..."

2.  **Skyvern Task Creation (Backend):**
    *   **Trigger:** New row in `applications` with `status = 'pending_submission'` (Supabase Realtime or Edge Function).
    *   **Action (Backend - Supabase Edge Function or dedicated backend service):**
        *   Retrieve user's resume URL from Supabase `users` table.
        *   Retrieve job application URL (original post URL from `job_details`).
        *   Call Skyvern API (`/submit_application` endpoint - refer to `backend_structure.md`):
            *   Pass resume URL, job application URL, user identifiers (if needed by Skyvern for callbacks/webhooks).
        *   On Skyvern API success (task accepted):
            *   Update the `applications` table row:
                *   `skyvern_task_id`: Skyvern's returned task ID.
                *   `status`: `submitted_to_skyvern`.
        *   On Skyvern API failure (e.g., invalid parameters):
            *   Update the `applications` table row:
                *   `status`: `failed_submission_request`.
                *   `error_message`: "Could not initiate application with Skyvern."
    *   **App Feedback:**
        *   If `submitted_to_skyvern`: Update UI (e.g., on Applications tab or a toast notification): "Application submitted to our system. We'll notify you of updates."
        *   If `failed_submission_request`: Update UI: "Failed to start application. Please try again."

3.  **Skyvern Processing & Webhooks (Backend):**
    *   Skyvern processes the application asynchronously.
    *   Skyvern calls a webhook endpoint on our backend (defined in `backend_structure.md`) with updates:
        *   `skyvern_task_id`, `status` (e.g., `processing`, `completed_successfully`, `failed`, `action_required`), `details` (e.g., confirmation message, error reason).
    *   **Backend Action (Webhook Handler - Supabase Edge Function or dedicated backend service):**
        *   Find the corresponding application in `applications` table using `skyvern_task_id`.
        *   Update `status`, `error_message` (if any), and potentially `application_summary` or `confirmation_details` based on webhook payload.
        *   If `status` is `action_required`, store the details of what action is needed.

4.  **Application Status Updates (In-App):**
    *   The `Applications` tab (listening to Supabase Realtime updates on `applications` table) will reflect status changes.
    *   Push notifications (Expo Notifications) can be triggered by backend on significant status changes (e.g., `completed_successfully`, `failed`, `action_required`).
    *   If `action_required`:
        *   The Application Details screen should display the necessary information/prompt for the user. (Further design needed for how to handle various `action_required` scenarios – could be manual steps, or future integration for more complex interactions).

## 5. Accessibility Considerations

*   **Semantic Elements:** Use `ThemedText` and `ThemedView` which can be customized for accessibility labels and roles.
*   **Contrast:** Adhere to WCAG AA contrast ratios (managed via `constants/Colors.ts`).
*   **Dynamic Type:** Support system font size changes where feasible.
*   **Screen Reader Support:** Ensure all interactive elements have appropriate `accessibilityLabel` and `accessibilityHint` props. Test with VoiceOver (iOS) and TalkBack (Android).
*   **Haptic Feedback:** Use `HapticTab.tsx` for tab navigation, consider haptics for other key interactions (e.g., successful submission) via `expo-haptics`.

## 6. Error Handling & Edge Cases

*   **Network Errors:**
    *   Global handler for API calls (Adzuna, Supabase, Skyvern).
    *   Display user-friendly messages (e.g., "No internet connection," "Could not fetch data, please try again").
    *   Retry mechanisms for transient errors.
*   **API Errors (Adzuna, Skyvern):**
    *   Specific error messages based on API responses where possible.
    *   Log detailed errors for debugging.
*   **Supabase Errors:**
    *   Handle data write/read failures gracefully.
*   **Clerk Authentication Errors:**
    *   Clerk's UI components handle most common auth errors. Custom flows should also manage errors like invalid credentials, email already exists, etc.
*   **Form Validation:**
    *   Client-side validation for inputs (e.g., profile editing, search filters).
*   **Empty States:**
    *   All lists (job search results, applications, etc.) should have clear empty state messages.
*   **Skyvern `action_required`:**
    *   Clearly present the required action to the user. If the action cannot be performed in-app, guide the user appropriately.
*   **Large Data:**
    *   Implement pagination or infinite scrolling for long lists (job search, applications).

## 7. Visual Polish and UI Elements

*   Refer to `frontend_guidelines.md` for component styling, typography, and consistent use of UI elements like `IconSymbol`, `TabBarBackground`, `Collapsible`, `ParallaxScrollView`.
*   Ensure loading states are visually clear (e.g., using `ActivityIndicator` or skeleton screens).
*   Animations and transitions should be smooth (leveraging `react-native-reanimated`).

*(End of Document)*
