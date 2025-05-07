# Jobraker - Phase 1 Implementation Plan

**Version:** 1.0
**Last Updated:** May 7, 2025
**Status:** Draft
**Owner:** Engineering Lead

## 0. Document History
| Version | Date       | Author          | Changes                                      |
|---------|------------|-----------------|----------------------------------------------|
| 1.0     | May 7, 2025 | AI Assistant    | Initial draft of Phase 1 Implementation Plan |

## 1. Introduction

This document outlines the implementation plan for Phase 1 of the Jobraker application. The primary goal of this phase is to deliver a Minimum Viable Product (MVP) that allows users to sign up, create/refine their resume with AI assistance, and initiate automated job searches using Adzuna. This plan is derived from the existing project documentation, including `Jobraker_PRD.markdown`, `app_flow.md`, `backend_structure.md`, and `tech_stack.md`.

## 2. Phase 1 Scope: Core User Journey & Foundation

Phase 1 focuses on establishing the foundational elements of the Jobraker application, centered around the initial user experience from authentication to the first automated job search.

**Key Features for Phase 1:**

*   User Authentication (Sign Up & Login) via Clerk.
*   Basic Onboarding Flow.
*   AI-Assisted Resume Preparation (upload, AI suggestions - initial version).
*   Automated Job Search Configuration.
*   Integration with Adzuna for job searching.
*   Display of job search results.
*   Core backend setup on Supabase for user data, preferences, and resume storage.

### 2.1. Sprint 1: Authentication & Onboarding

**Goal:** Users can create an account, log in, and complete a basic onboarding process.

*   **Task 1.1: Implement Clerk Authentication**
    *   **Description:** Integrate Clerk for user sign-up and sign-in functionalities.
        *   Utilize `@clerk/clerk-expo` for pre-built UI components.
        *   Configure social logins (Google, LinkedIn as specified in `app_flow.md`).
        *   Ensure JWT is obtained and handled for subsequent API calls to Supabase.
    *   **Affected Files/Modules:** `app/_layout.tsx` (for ClerkProvider), new authentication screens/components if custom UI is needed beyond Clerk's defaults, Supabase `auth.users` table (automatic via Clerk).
    *   **Reference:** `app_flow.md` (Section 4.1), `backend_structure.md` (Section 3.1, trigger for `public.users`).

*   **Task 1.2: Design and Develop Basic Onboarding Flow**
    *   **Description:** Create a simple onboarding sequence after the first successful sign-up.
        *   Prompt for essential information (e.g., name if not from social, primary job-seeking goal - can be simple).
        *   Guide users towards the resume preparation step.
    *   **Affected Files/Modules:** New screens for onboarding, navigation updates in `app/_layout.tsx` or a dedicated auth/onboarding stack.
    *   **Reference:** `app_flow.md` (Section 4.1, Step 3 - Initial Profile Setup, simplified for Phase 1).

*   **Task 1.3: Setup Supabase `users` Table and Clerk Sync**
    *   **Description:** Implement the `public.users` table in Supabase and the trigger `handle_new_user` to populate it upon new Clerk user creation.
    *   **Affected Files/Modules:** Supabase schema (SQL), `backend_structure.md` (Section 3.1).
    *   **Reference:** `backend_structure.md`.

### 2.2. Sprint 2: AI Resume Preparation

**Goal:** Users can upload their resume and receive initial AI-driven feedback.

*   **Task 2.1: Design UI for Resume Upload and AI Feedback Display**
    *   **Description:** Create the user interface for uploading a resume file and viewing suggestions.
        *   Simple file picker integration.
        *   Area to display text-based feedback.
    *   **Affected Files/Modules:** New screen/component for resume management within the `(tabs)/profile.tsx` (to be created) or a dedicated resume section.
    *   **Reference:** `app_flow.md` (Section 4.5.1 - Resume Management).

*   **Task 2.2: Implement Resume Upload Functionality**
    *   **Description:** Allow users to upload their resume (PDF, DOCX). Store the resume securely in Supabase Storage.
        *   Update `public.users` or a new `resumes` table to store the path/URL to the resume.
    *   **Affected Files/Modules:** Resume management screen, Supabase Storage configuration, relevant Supabase table schema.
    *   **Reference:** `backend_structure.md` (consider adding a `resumes` table or a field in `users` for resume URL).

*   **Task 2.3: Integrate Placeholder for AI Resume Analysis**
    *   **Description:** For Phase 1, integrate a mock or basic AI service.
        *   This could be a simple keyword checker or a placeholder function that returns predefined suggestions.
        *   The focus is on the flow and UI, with a more sophisticated AI integration planned for a later phase.
        *   If a simple API is available, integrate it. Otherwise, simulate the interaction.
    *   **Affected Files/Modules:** Resume management screen, potentially a new Supabase Edge Function if the "AI" logic runs server-side.

### 2.3. Sprint 3: Automated Job Search & Adzuna Integration

**Goal:** Users can configure basic job search preferences and view jobs fetched from Adzuna.

*   **Task 3.1: Design UI for Job Search Configuration**
    *   **Description:** Create an interface for users to input basic job search preferences (e.g., keywords, location).
    *   **Affected Files/Modules:** New screen/component, likely part of the `(tabs)/explore.tsx` or a new "Job Search Setup" screen.
    *   **Reference:** `app_flow.md` (Section 4.3.1 - Search Interface, simplified for automated setup).

*   **Task 3.2: Implement Adzuna API Integration**
    *   **Description:** Connect to the Adzuna API to fetch job listings.
        *   Handle API key management securely.
        *   Implement functions to search jobs based on user criteria.
    *   **Affected Files/Modules:** New service/module for Adzuna API calls.
    *   **Reference:** `tech_stack.md` (mentions Adzuna), `app_flow.md` (Section 4.3).

*   **Task 3.3: Develop Initial Automated Job Search Logic**
    *   **Description:** Based on user's resume (keywords extracted, if feasible in Phase 1) and defined preferences, automatically query Adzuna.
        *   For Phase 1, this might be a manually triggered "Find Jobs Now" button after setup.
    *   **Affected Files/Modules:** Job search configuration screen/logic.

*   **Task 3.4: Design UI for Displaying Job Search Results**
    *   **Description:** Create a view to list job results fetched from Adzuna.
        *   Basic `JobCard` component as outlined in `frontend_guidelines.md`.
    *   **Affected Files/Modules:** `(tabs)/explore.tsx` or a dedicated results screen.
    *   **Reference:** `app_flow.md` (Section 4.3.1 - Results Area).

*   **Task 3.5: Setup Supabase `job_preferences` Table**
    *   **Description:** Implement the `public.job_preferences` table in Supabase to store user's job search criteria.
    *   **Affected Files/Modules:** Supabase schema (SQL).
    *   **Reference:** `backend_structure.md` (Section 3.2).

### 2.4. Sprint 4: UI Shell & Navigation (Parallel with Sprints 1-3)

**Goal:** Establish the basic tab navigation and screen structure for Phase 1 features.

*   **Task 4.1: Create Basic Tab Structure**
    *   **Description:** Implement the main tab navigator as per `app_flow.md`.
        *   Home (`index.tsx`): Basic landing page after login.
        *   Search/Explore (`explore.tsx`): For Adzuna job display and search setup.
        *   (New) Applications (`applications.tsx`): Placeholder for Phase 1, will list applications initiated.
        *   (New) Profile (`profile.tsx`): For resume upload and basic profile info.
    *   **Affected Files/Modules:** `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, create `app/(tabs)/applications.tsx`, `app/(tabs)/profile.tsx`.
    *   **Reference:** `app_flow.md` (Section 3).

*   **Task 4.2: Implement Navigation Between Screens**
    *   **Description:** Set up stack navigators within tabs for flows like Onboarding -> Home, Profile -> Edit Resume.
    *   **Affected Files/Modules:** Expo Router configuration within relevant screen and layout files.

## 3. Key Milestones for Phase 1

1.  **Milestone 1 (End of Sprint 1):** Users can sign up, log in, and see a basic home screen. `public.users` table is populated.
2.  **Milestone 2 (End of Sprint 2):** Users can access a profile section, upload a resume, and view placeholder AI feedback. Resume stored in Supabase.
3.  **Milestone 3 (End of Sprint 3):** Users can input job preferences, trigger a search, and view a list of jobs from Adzuna. `job_preferences` table is used.
4.  **Milestone 4 (End of Sprint 4 / Phase 1 Completion):** All Phase 1 features integrated with basic navigation and UI shell. Application is testable end-to-end for the defined scope.

## 4. Dependencies & Risks

*   **External Services:**
    *   **Clerk:** Stability and correct integration of the SDK.
    *   **Adzuna API:** API availability, rate limits, and understanding its query parameters.
    *   **Supabase:** Platform availability and performance.
*   **AI Integration (Resume Prep):**
    *   The "AI" part is a placeholder in Phase 1. If a real (even simple) AI service is chosen, its integration complexity could be a risk. For now, mocking this is safer.
*   **Scope Creep:** Sticking to the defined MVP features for Phase 1 is crucial.
*   **Team Velocity:** Accurate estimation of task complexity.

## 5. Next Steps (Phase 2 Preview)

Upon successful completion of Phase 1, Phase 2 will focus on:

*   Full Skyvern integration for automated job applications.
*   Enhanced AI capabilities for resume preparation and job matching.
*   Detailed application tracking features.
*   Notifications.
*   More comprehensive user profile and settings.

*(End of Document)*
