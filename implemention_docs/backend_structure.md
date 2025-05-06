# Jobraker Backend Structure

## 1. Introduction
This document outlines the backend structure and components of the Jobraker mobile application, focusing on the use of Supabase as the primary backend service and interactions with external APIs.

## 2. Core Technologies
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage
- **Authentication:** Clerk (integrated via JWT)
- **External APIs:** Adzuna (Job Listings), Skyvern (Application Automation)

## 3. Database Structure (Supabase)
Jobraker uses a PostgreSQL database managed by Supabase. The key tables are:

- **`users` table:**
  - Stores user profile information and preferences.
  - Key fields include: `id` (linked to Clerk user ID), `name`, `email`, `phone`, `resume_url` (link to file in Supabase Storage), `preferred_job_title`, `location`, `salary_range`, `remote_preference`, `industry`.
  - Implements Row Level Security (RLS) to ensure users can only access their own data.

- **`applications` table:**
  - Tracks the history and status of job applications submitted via Skyvern.
  - Key fields include: `id`, `user_id` (foreign key to `users` table), `job_id` (identifier for the job), `skyvern_task_id` (ID returned by Skyvern), `status` (e.g., Pending, Submitted, Failed), `application_date`.
  - RLS is applied to restrict access to applications belonging to the authenticated user.

## 4. File Storage (Supabase Storage)
- Used for securely storing user resume files (PDF, DOCX).
- Files are organized typically by user ID.
- Supabase Storage policies are configured to restrict access to uploaded files, ensuring only the owning user can retrieve or manage them.
- The URL of the stored file is saved in the `resume_url` field of the `users` table.

## 5. Authentication Integration
- While Clerk handles the primary authentication flow (sign-in/up), it integrates with the backend by providing a JSON Web Token (JWT) upon successful authentication.
- This JWT contains the authenticated user's ID.
- Supabase is configured to verify this JWT and use the user ID within it to enforce Row Level Security (RLS) policies on database tables (`users`, `applications`) and Supabase Storage.
- This ensures that database operations and file access are restricted to the currently authenticated user.

## 6. API Interactions
- **Adzuna API:**
  - The backend (or potentially direct frontend calls depending on architecture, but often proxied through backend for security/rate limiting) interacts with the Adzuna API to fetch job listings based on user search criteria and preferences.
  - Query parameters like job title, location, salary range, remote preference, and industry are passed to the `/us/search/1` endpoint.
- **Skyvern API:**
  - When a user initiates an application, a request is sent to the Skyvern API.
  - This request includes the job posting URL (`redirect_url` from Adzuna data) and user-specific data required for form filling (retrieved from the `users` table, including the `resume_url`).
  - Skyvern processes the request and returns a `task_id`.
  - The `task_id` and the initial status (Pending) are saved in the `applications` table.
  - Updates on the application status (Submitted, Failed) are ideally handled via webhooks from Skyvern or periodic polling, updating the `status` field in the `applications` table.

## 7. Security Practices
- **Row Level Security (RLS):** Critically important for data privacy in Supabase, restricting user access to their own data.
- **Supabase Storage Policies:** Controlling who can upload, download, and delete files.
- **HTTPS:** Ensuring all communication with Supabase and external APIs is encrypted.
- **API Key Management:** Storing sensitive API keys securely (e.g., using environment variables managed server-side or securely within the Supabase environment, not directly in the frontend code where `expo-dotenv` is used for frontend exposure).
- **Input Validation:** Although frontend validation exists, backend validation should also be implemented where necessary before writing data to the database.
