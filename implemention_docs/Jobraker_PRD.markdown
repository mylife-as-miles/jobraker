# Product Requirements Document (PRD) for Jobraker Mobile App

## 1. Overview
### 1.1 Product Name
Jobraker

### 1.2 Product Vision
Jobraker is a mobile application that empowers job seekers to autonomously find and apply for jobs with minimal effort. By integrating AI-driven job search, browser automation, and advanced analytics, Jobraker streamlines the job application process, delivering personalized job matches and actionable insights.

### 1.3 Objectives
- Provide a user-friendly mobile app for job searching, application automation, and performance tracking.
- Leverage Adzuna for comprehensive job listings and Skyvern for AI-powered form filling.
- Ensure secure authentication with Clerk and scalable data storage with Supabase.
- Deliver a modern, accessible, and feature-rich app for iOS and Android via Expo.

### 1.4 Target Audience
- Job seekers (entry-level to senior professionals) seeking efficient, data-driven job application processes.
- Tech-savvy users comfortable with mobile apps, automation, and analytics.
- Primary markets: United States, with potential expansion to other Adzuna-supported regions.

## 2. Features and Functionality
### 2.1 User Authentication
- **Description**: Secure sign-in/up using Clerk, supporting email/password and social logins (Google, LinkedIn).
- **Details**:
  - Pre-built Clerk UI components for sign-in, sign-up, and password reset.
  - JWT-based authentication for Supabase row-level security (RLS).
  - Redirect new users to profile setup; returning users to home screen.
- **Priority**: High
- **Dependencies**: Clerk API, Expo SecureStore.

### 2.2 Profile Setup
- **Description**: Onboarding flow to collect user data (resume, personal info, job preferences).
- **Details**:
  - Input fields: name, email, phone, resume (file upload, text, or URL), preferred job title, location, salary range, remote preference, industry.
  - Save data to Supabase `users` table; upload resume files to Supabase Storage.
  - Optional “Skip” with default preferences.
- **Priority**: High
- **Dependencies**: Supabase, Supabase Storage, Clerk user ID.

### 2.3 Job Search
- **Description**: Search and display job listings from Adzuna with advanced filtering.
- **Details**:
  - Input fields: job title, location, salary range, remote (yes/no), industry (e.g., tech, finance).
  - Pre-fill from user preferences stored in Supabase.
  - Display jobs in a scrollable list (title, company, description snippet, salary, remote status).
  - Filter/sort options (date, relevance, salary).
  - API: Adzuna `/us/search/1` endpoint.
- **Priority**: High
- **Dependencies**: Adzuna API, Supabase.

### 2.4 Application Automation
- **Description**: Automate job applications using Skyvern’s AI-powered browser automation.
- **Details**:
  - “Apply” button per job triggers Skyvern task.
  - Send job URL (Adzuna `redirect_url`) and user data (from Supabase, including resume file URL) to Skyvern.
  - Skyvern fills forms, handles CAPTCHAs/2FA, and submits applications.
  - Save task ID and status to Supabase `applications` table.
- **Priority**: High
- **Dependencies**: Skyvern API, Supabase, Adzuna.

### 2.5 Profile Management
- **Description**: Allow users to update their data and sign out.
- **Details**:
  - Edit fields: name, email, phone, resume (file upload, text, or URL), job preferences (title, location, salary, remote, industry).
  - Update Supabase `users` table; upload new resumes to Supabase Storage.
  - Sign-out via Clerk.
- **Priority**: Medium
- **Dependencies**: Supabase, Supabase Storage, Clerk.

### 2.6 Application History
- **Description**: Display past and pending applications with statuses.
- **Details**:
  - List view: job ID, company, status (Pending, Submitted, Failed), date.
  - Real-time updates via Supabase subscriptions.
  - Filter by status.
- **Priority**: Medium
- **Dependencies**: Supabase.

### 2.7 Analytics Dashboard
- **Description**: Visualize application success rates and trends.
- **Details**:
  - Display metrics: total applications, success rate (Submitted/Total), status breakdown (Pending, Submitted, Failed).
  - Charts: Pie chart for status distribution, line chart for applications over time.
  - Fetch data from Supabase `applications` table.
  - Filter by time range (e.g., last 7 days, 30 days).
- **Priority**: Medium
- **Dependencies**: Supabase, charting library (e.g., `react-native-chart-kit`).

### 2.8 Resume File Uploads
- **Description**: Allow users to upload resume files to Supabase Storage.
- **Details**:
  - Support PDF, DOCX formats (max 5MB).
  - Upload via file picker in `ProfileSetupScreen` and `ProfileScreen`.
  - Store file in Supabase Storage, save URL in `users` table.
  - Pass resume URL to Skyvern for application automation.
- **Priority**: High
- **Dependencies**: Supabase Storage, `react-native-document-picker`.

### 2.9 Advanced Job Filters
- **Description**: Refine job searches by salary, remote work, and industry.
- **Details**:
  - Filters: salary range (e.g., $50k-$100k), remote (yes/no), industry (dropdown: tech, finance, healthcare, etc.).
  - Save preferences in Supabase `users` table.
  - Apply filters to Adzuna API queries (e.g., `salary_min`, `salary_max`, `category`).
- **Priority**: High
- **Dependencies**: Adzuna API, Supabase.

### 2.10 Security and Privacy
- **Description**: Ensure secure data handling and compliance.
- **Details**:
  - Encrypt API calls (HTTPS) and local storage (Expo SecureStore).
  - Supabase RLS to restrict data access to authenticated users.
  - Secure resume uploads with Supabase Storage access controls.
  - Compliance with GDPR/CCPA for user data.
  - Hide API keys using `expo-dotenv`.
- **Priority**: High
- **Dependencies**: Clerk, Supabase, Expo.

## 3. User Interface Flow
### 3.1 Flow Diagram
```
[SignInScreen] --> [New User?] --> [ProfileSetupScreen] --> [HomeScreen]
   |                         |
   |                   [Returning User]
   |                         |
   +------------------> [HomeScreen] --> [ProfileScreen]
                                 |
                                 +--> [ApplicationsScreen]
                                 |
                                 +--> [AnalyticsScreen]
```

### 3.2 Screen Descriptions and Wireframes
#### 3.2.1 SignInScreen
- **Purpose**: Authenticate users.
- **Wireframe**:
  ```
  +-----------------------------------+
  |          Jobraker Logo           |
  |-----------------------------------|
  |      [Clerk SignIn Component]     |
  |   Email/Password or Google Login  |
  |   [Sign Up]   [Forgot Password?]  |
  +-----------------------------------+
  ```
- **Elements**: Clerk `SignIn` component, logo, sign-up link.
- **Navigation**: To `ProfileSetupScreen` (new users) or `HomeScreen` (returning).

#### 3.2.2 ProfileSetupScreen
- **Purpose**: Collect user data for onboarding.
- **Wireframe**:
  ```
  +-----------------------------------+
  |         Set Up Your Profile       |
  |-----------------------------------|
  | Name:    [_______________]        |
  | Email:   [_______________]        |
  | Phone:   [_______________]        |
  | Resume:  [Upload File] [Text/URL] |
  | Job Title: [_____________]        |
  | Location:  [_____________]        |
  | Salary:    [Min] - [Max]         |
  | Remote:    [Yes/No]              |
  | Industry:  [Dropdown]            |
  | [Save]               [Skip]       |
  +-----------------------------------+
  ```
- **Elements**: `TextInput`, file picker, dropdown, Save/Skip buttons.
- **Navigation**: To `HomeScreen`.

#### 3.2.3 HomeScreen
- **Purpose**: Search jobs and initiate applications.
- **Wireframe**:
  ```
  +-----------------------------------+
  | Job Title: [_____________]        |
  | Location:  [_____________]        |
  | Salary:    [Min] - [Max]         |
  | Remote:    [Yes/No]              |
  | Industry:  [Dropdown]            |
  | [Search]                          |
  |-----------------------------------|
  | Job List:                         |
  | - Title, Company, Salary, Remote  |
  |   [Apply]                         |
  | - Title, Company, Salary, Remote  |
  |   [Apply]                         |
  |-----------------------------------|
  | [Profile] [Applications] [Analytics] |
  +-----------------------------------+
  ```
- **Elements**: `TextInput`, dropdown, `FlatList`, Apply buttons, navigation bar.
- **Navigation**: To `ProfileScreen`, `ApplicationsScreen`, `AnalyticsScreen`.

#### 3.2.4 ProfileScreen
- **Purpose**: Update user data.
- **Wireframe**:
  ```
  +-----------------------------------+
  |           Your Profile            |
  |-----------------------------------|
  | Name:    [_______________]        |
  | Email:   [_______________]        |
  | Phone:   [_______________]        |
  | Resume:  [Upload File] [Text/URL] |
  | Job Title: [_____________]        |
  | Location:  [_____________]        |
  | Salary:    [Min] - [Max]         |
  | Remote:    [Yes/No]              |
  | Industry:  [Dropdown]            |
  | [Save]   [Sign Out]               |
  +-----------------------------------+
  ```
- **Elements**: `TextInput`, file picker, dropdown, Save/Sign Out buttons.
- **Navigation**: Back to `HomeScreen`.

#### 3.2.5 ApplicationsScreen
- **Purpose**: View application history.
- **Wireframe**:
  ```
  +-----------------------------------+
  |       Your Applications           |
  |-----------------------------------|
  | Application List:                 |
  | - Job ID, Status, Date            |
  | - Job ID, Status, Date            |
  |-----------------------------------|
  | [Filter: Pending/Submitted]       |
  +-----------------------------------+
  ```
- **Elements**: `FlatList`, filter dropdown.
- **Navigation**: Back to `HomeScreen`.

#### 3.2.6 AnalyticsScreen
- **Purpose**: Visualize application success rates and trends.
- **Wireframe**:
  ```
  +-----------------------------------+
  |       Application Analytics       |
  |-----------------------------------|
  | Total Applications: [100]         |
  | Success Rate: [80%]               |
  | [Pie Chart: Status Breakdown]     |
  | [Line Chart: Apps Over Time]      |
  |-----------------------------------|
  | [Filter: 7d/30d/All]             |
  +-----------------------------------+
  ```
- **Elements**: Text metrics, charts (pie, line), time range filter.
- **Navigation**: Back to `HomeScreen`.

## 4. Technical Requirements
### 4.1 Technology Stack
- **Front-end**: React Native 0.74.1, Expo SDK ~51.0.8.
  - Libraries: `@react-navigation`, `axios`, `nativewind`, `@clerk/clerk-expo`, `@supabase/supabase-js`, `expo-secure-store`, `expo-dotenv`, `react-native-chart-kit`, `react-native-document-picker`.
- **Authentication**: Clerk (JWT-based).
- **Database**: Supabase (PostgreSQL with RLS).
  - Tables: `users` (id, resume_url, personal_info, preferences), `applications` (id, user_id, job_id, skyvern_task_id, status).
  - Storage: Supabase Storage for resume files (PDF, DOCX).
- **APIs**:
  - Adzuna: `https://api.adzuna.com/v1/api/jobs`.
  - Skyvern: `https://app.skyvern.com/api` or self-hosted.
- **Security**: HTTPS, encrypted storage, GDPR/CCPA compliance.
- **Testing**: Jest (unit), Detox (E2E).
- **CI/CD**: Expo EAS, GitHub Actions.

### 4.2 Non-Functional Requirements
- **Performance**: Job search < 2s, application submission < 10s, resume upload < 5s.
- **Scalability**: Handle 10,000 active users, 1,000 daily applications, 100MB daily Storage uploads.
- **Availability**: 99.9% uptime (Supabase/Clerk cloud).
- **Accessibility**: WCAG 2.1 compliance (labels, contrast, font sizes).

## 5. Launch KPIs
### 5.1 User Acquisition
- **Target**: 1,000 registered users within 3 months post-launch.
- **Metric**: Number of sign-ups via Clerk.

### 5.2 Engagement
- **Target**: 500 daily active users (DAU) within 3 months.
- **Metric**: App sessions, filter usage, analytics views (via Mixpanel).

### 5.3 Job Applications
- **Target**: 5,000 automated applications submitted via Skyvern in 3 months.
- **Metric**: Records in Supabase `applications` table.

### 5.4 Resume Uploads
- **Target**: 80% of users upload a resume file within 3 months.
- **Metric**: Supabase `users` table with non-null `resume_url`.

### 5.5 Filter Usage
- **Target**: 50% of job searches use advanced filters (salary, remote, industry).
- **Metric**: Supabase `preferences` updates, Adzuna query logs.

### 5.6 Analytics Engagement
- **Target**: 30% of users view `AnalyticsScreen` weekly.
- **Metric**: Screen views tracked via analytics.

### 5.7 Retention
- **Target**: 60% user retention rate (users returning within 30 days).
- **Metric**: DAU/MAU ratio.

### 5.8 Success Rate
- **Target**: 80% of Skyvern tasks complete successfully (status: Submitted).
- **Metric**: Supabase `applications` status distribution.

## 6. Acceptance Criteria
### 6.1 SignInScreen
- Users can sign in/up with email/password or Google OAuth.
- New users redirect to `ProfileSetupScreen`; returning users to `HomeScreen`.
- JWT token is stored securely via Expo SecureStore.
- Error messages display for invalid credentials.

### 6.2 ProfileSetupScreen
- Users can input name, email, phone, resume (file, text, or URL), job title, location, salary range, remote preference, industry.
- Resume files (PDF, DOCX, <5MB) upload to Supabase Storage; URL saves to `users` table.
- Data saves to Supabase with Clerk user ID.
- “Skip” sets default preferences.
- Redirects to `HomeScreen` on save.

### 6.3 HomeScreen
- Users can search jobs by title, location, salary, remote, industry; pre-filled from preferences.
- Displays at least 10 jobs from Adzuna in a scrollable Ascending/descending list.
- “Apply” button triggers Skyvern task, saves status to Supabase.
- Navigation to `ProfileScreen`, `ApplicationsScreen`, `AnalyticsScreen` works.

### 6.4 Application Automation
- Skyvern receives job URL and user data (including resume URL), returns task ID.
- Application status (Pending, Submitted, Failed) saves to Supabase.
- Loading indicator shows during Skyvern task.
- Success/error notifications display to user.

### 6.5 ProfileScreen
- Users can update name, email, phone, resume (file, text, or URL), preferences (title, location, salary, remote, industry).
- Resume files upload to Supabase Storage; URL updates in `users` table.
- Updates save to Supabase.
- Sign-out via Clerk redirects to `SignInScreen`.

### 6.6 ApplicationsScreen
- Displays list of applications (job ID, status, date).
- Real-time updates via Supabase subscriptions.
- Filter by status (Pending, Submitted).
- Empty state shows “No applications yet.”

### 6.7 AnalyticsScreen
- Displays total applications, success rate, status breakdown (pie chart), applications over time (line chart).
- Filter by time range (7d, 30d, All).
- Data fetched from Supabase `applications` table.
- Charts render correctly with `react-native-chart-kit`.

### 6.8 Resume File Uploads
- Users can upload PDF/DOCX resumes (<5MB) in `ProfileSetupScreen` and `ProfileScreen`.
- Files save to Supabase Storage; URLs save to `users` table.
- Resume URL is sent to Skyvern for applications.
- Error messages display for invalid file types or sizes.

### 6.9 Advanced Job Filters
- Users can filter jobs by salary range, remote (yes/no), industry (dropdown).
- Filters save to Supabase `users` preferences.
- Adzuna API queries reflect filter parameters.
- Filters persist across sessions.

### 6.10 Security
- All API calls use HTTPS.
- Supabase RLS restricts data to authenticated usernames.
- Resume uploads are secured with Supabase Storage policies.
- API keys are hidden via `expo-dotenv`.
- User data is encrypted in Supabase and local storage.

## 7. Risks and Mitigation
- **Risk**: Adzuna API rate limits.
  - **Mitigation**: Cache job listings in Supabase, implement retry logic.
- **Risk**: Skyvern fails on complex job forms.
  - **Mitigation**: Use Skyvern diagnostics, refine prompts.
- **Risk**: Job boards block automated applications.
  - **Mitigation**: Review terms, use Skyvern’s anti-bot features.
- **Risk**: Supabase/Clerk downtime.
  - **Mitigation**: Monitor uptime, implement offline mode with AsyncStorage.
- **Risk**: Large resume files slow uploads.
  - **Mitigation**: Enforce 5MB limit, optimize Supabase Storage.

## 8. Timeline
- **Phase 1: Development (8 weeks)**:
  - Week 1-2: Set up Expo, Clerk, Supabase, Storage.
  - Week 3-4: Implement UI screens, Adzuna integration, filters.
  - Week 5-6: Integrate Skyvern, resume uploads, analytics charts.
  - Week 7-8: Testing (Jest, Detox), bug fixes.
- **Phase 2: Beta Testing (2 weeks)**:
  - Internal testing with 50 users.
  - Collect feedback, iterate UI.
- **Phase 3: Launch (1 week)**:
  - Submit to App Store/Play Store via Expo EAS.
  - Monitor KPIs, address issues.
- **Total**: 11 weeks from kickoff to launch.

## 9. Stakeholders
- **Product Manager**: Defines requirements, tracks KPIs.
- **Engineering Team**:
  - Front-end: React Native/Expo developers.
  - Back-end: Supabase/Storage configuration.
- **Design**: UI/UX designer for wireframes, Tailwind CSS styling.
- **QA**: Testers for Jest, Detox, manual testing.
- **Legal**: Reviews job board terms, GDPR/CCPA compliance.

## 10. Future Enhancements
- Integration with LinkedIn for profile import.
- Multi-region support beyond Adzuna’s US market.
- AI-driven job matching (e.g., via optional Groq integration).
- Push notifications for application status updates.

## 11. Appendices
### 11.1 Glossary
- **Adzuna**: Job search API providing structured listings.
- **Skyvern**: AI-powered browser automation for form filling.
- **Clerk**: Authentication service with JWT-based security.
- **Supabase**: Open-source PostgreSQL database with RLS and Storage.
- **Expo**: Managed workflow for React Native apps.

### 11.2 References
- Adzuna API: `https://developer.adzuna.com`
- Skyvern GitHub: `https://github.com/Skyvern-AI/Skyvern`
- Clerk Docs: `https://clerk.com/docs`
- Supabase Docs: `https://supabase.com/docs`
- Expo Docs: `https://docs.expo.dev`

---

**Approval**  
- **Product Manager**: [Name, Date]  
- **Engineering Lead**: [Name, Date]  
- **Design Lead**: [Name, Date]