# Jobraker Application User Interface Flow

## 1. Introduction
This document provides a detailed overview of the user interface flow within the Jobraker mobile application. It outlines the primary screens, their purpose, key interactive elements, and the navigation pathways between them, based on the product requirements and technical blueprint.

## 2. Core Application Flow

The main user journey through the application typically follows this path:

```mermaid
graph TD
    A[Sign-In/Sign-Up Screen] --> B{New User?}
    B -- Yes --> C[Profile Setup Screen]
    B -- No --> D[Home Screen]
    C --> D
    D --> E[Profile Screen]
    D --> F[Applications Screen]
    D --> G[Analytics Screen]
    E --> D
    F --> D
    G --> D
    E --> A[Sign-In/Sign-Up Screen (Sign Out)]
```
*Note: This diagram uses Mermaid syntax for clarity.* 

## 3. Screen Descriptions and Interactions

### 3.1 Sign-In/Sign-Up Screen
-   **Purpose:** Serves as the entry point for users to authenticate or register for a new account.
-   **Key Elements:**
    -   Application Logo/Branding.
    -   Clerk authentication component: Provides standard input fields for email/password, and options for social logins (e.g., Google, LinkedIn).
    -   "Sign Up" link/button for new users.
    -   "Forgot Password?" link for password recovery.
-   **User Interactions:** Users enter credentials or select a social login provider. Tapping "Sign In" or completing social login initiates the authentication process via Clerk. Tapping "Sign Up" navigates to the registration flow within the Clerk component. Tapping "Forgot Password?" initiates the password reset process.
-   **Navigation:**
    -   On successful sign-in for an existing user: Navigates to the `HomeScreen`.
    -   On successful sign-up for a new user: Navigates to the `ProfileSetupScreen`.
    -   Authentication errors (e.g., invalid credentials) display inline messages provided by the Clerk component.

### 3.2 Profile Setup Screen
-   **Purpose:** Guides new users through the initial collection of essential profile information and job preferences required for the application's core functionality.
-   **Key Elements:**
    -   Input fields (TextInput) for: Name, Email (pre-filled from auth, potentially read-only), Phone.
    -   Resume Upload section: Button to trigger file picker (`react-native-document-picker`), options for text input or URL if applicable (future consideration/alternative).
    -   Input fields/Pickers for Job Preferences: Preferred Job Title, Location, Salary Range (Min/Max), Remote Preference (Toggle/Dropdown: Yes/No/Hybrid/Any), Industry (Dropdown).
    -   "Save" button to submit the profile data.
    -   "Skip" button to bypass setup (with default preferences applied).
-   **User Interactions:** Users fill out forms, select preferences from dropdowns, and upload their resume file. Tapping "Save" triggers validation and persistence of data to the Supabase `users` table and resume upload to Supabase Storage. Tapping "Skip" saves a minimal profile with default settings.
-   **Validation:** Client-side validation should be performed before submission (e.g., required fields, file size/type). Server-side validation is handled implicitly by Supabase RLS and schema constraints.
-   **Navigation:** On successful data submission (Save or Skip), navigates to the `HomeScreen`.

### 3.3 Home Screen
-   **Purpose:** The central hub for job searching and initiating the application automation process.
-   **Key Elements:**
    -   Search input fields (TextInput) pre-filled with user preferences (Job Title, Location, Salary, Remote, Industry).
    -   "Search" button to trigger job search.
    -   Job Listings Area: A scrollable list (`FlatList`) displaying job entries fetched from the Adzuna API.
    -   Each Job Entry: Displays key information such as Job Title, Company Name, Location, Salary, and Remote status.
    -   "Apply" button for each job listing to initiate the Skyvern automation process.
    -   Bottom Navigation Bar: Provides access to `ProfileScreen`, `ApplicationsScreen`, and `AnalyticsScreen`.
-   **User Interactions:** Users can modify search criteria and tap "Search". The app fetches relevant jobs from Adzuna. Users scroll through listings and tap "Apply" on desired jobs. Tapping navigation icons switches screens.
-   **State Management:** Manages search input state, loading state for API calls, and the list of displayed job results.
-   **Navigation:** Navigates to the respective screens when tapping icons in the bottom navigation bar.

### 3.4 Profile Screen
-   **Purpose:** Allows authenticated users to view and update their previously saved profile information and job preferences.
-   **Key Elements:**
    -   Editable Input fields/Pickers for: Name, Email (potentially read-only), Phone, Resume (with options to view current, upload new, or update text/URL), Preferred Job Title, Location, Salary Range, Remote Preference, Industry.
    -   "Save Changes" button to update the profile data.
    -   "Sign Out" button to log the user out of the application.
-   **User Interactions:** Users modify fields as needed and tap "Save Changes" to persist updates to the Supabase `users` table and potentially upload a new resume file. Tapping "Sign Out" initiates the Clerk sign-out process.
-   **Validation:** Similar to Profile Setup, client-side validation on input. Supabase RLS enforces that only the owning user can modify their profile.
-   **Navigation:**
    -   Tapping "Save Changes" typically stays on the screen or navigates back to `HomeScreen` upon success.
    -   Tapping "Sign Out" navigates back to the `Sign-In/Sign-Up Screen`.

### 3.5 Applications Screen
-   **Purpose:** Displays a historical list of job applications initiated by the user through the automation process.
-   **Key Elements:**
    -   Application List Area: A scrollable list (`FlatList`) displaying entries from the Supabase `applications` table.
    -   Each Application Entry: Shows relevant details like Job Title (if available), Company Name (if available), the current Status (Pending, Processing, Submitted, Failed), and the Date of application.
    -   Status Filter/Dropdown: Allows users to filter the list by application status.
    -   Empty State: A message or illustration displayed when no applications have been initiated yet.
-   **User Interactions:** Users scroll through their application history. They can select a status from the filter to narrow down the list. The list should ideally update in real-time as application statuses change (using Supabase Realtime).
-   **Data Source:** Fetches data from the Supabase `applications` table, filtered by the authenticated user's ID via RLS.
-   **Navigation:** Accessible from the bottom navigation bar, typically returns to `HomeScreen`.

### 3.6 Analytics Screen
-   **Purpose:** Provides visual insights into the user's job application activity and success rates.
-   **Key Elements:**
    -   Summary Metrics: Displays key numbers like Total Applications, Success Rate (Submitted / Total), etc.
    -   Charts: Visual representations of application data.
        -   Pie Chart (`react-native-chart-kit`): Showing the breakdown of application statuses (Submitted, Failed, Pending, etc.).
        -   Line Chart (`react-native-chart-kit`): Showing the trend of applications over a specific time period.
    -   Time Range Filter/Dropdown: Allows users to select the period for the analytics data (e.g., Last 7 Days, Last 30 Days, All Time).
    -   Data Source Indicator: Might show when the data was last updated.
-   **User Interactions:** Users view the metrics and charts. They can change the time range filter to see data for different periods.
-   **Data Source:** Aggregates and visualizes data fetched from the Supabase `applications` table for the authenticated user.
-   **Navigation:** Accessible from the bottom navigation bar, typically returns to `HomeScreen`.
