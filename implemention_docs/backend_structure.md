# Jobraker Backend Structure & Supabase Configuration

**Version:** 2.1
**Last Updated:** May 7, 2025
**Status:** Revised
**Owner:** Engineering Lead (Backend Focus)
**Stakeholders:** Engineering Lead (Frontend Focus), Product Management, Security Lead

## 0. Document History
| Version | Date       | Author          | Changes                                                                                                                                  |
|---------|------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | Apr 28, 2025| [Previous Author] | Initial outline of Supabase tables                                                                                                       |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: Detailed schema, RLS policies, Storage config, Realtime setup, Edge Functions, Auth integration, and migration strategy |
| 2.1     | May 7, 2025 | AI Assistant    | Refined table structures (added `saved_jobs`, `saved_searches`), enhanced RLS, detailed Skyvern webhook security, added `notifications` table, and clarified Clerk user ID handling. |

## 1. Introduction

This document details the backend structure of the Jobraker application, specifically focusing on its implementation using Supabase. It covers database schema, Row Level Security (RLS) policies, storage configuration, real-time capabilities, authentication integration with Clerk, Supabase Edge Functions, and data management strategies. This document is a critical companion to `Jobraker_PRD.markdown`, `app_flow.md`, and `tech_stack.md`.

## 2. Supabase Project Setup

- **Project URL:** `https://[YOUR_PROJECT_ID].supabase.co` (To be provisioned)
- **API Key (anon, public):** Stored in client-side environment variables (e.g., via `expo-dotenv`).
- **API Key (service_role, secret):** Stored securely in backend environments (e.g., GitHub Actions secrets for CI/CD, Supabase Edge Function secrets). **Never expose this key on the client.**
- **Region:** `[To Be Determined - e.g., US West (Oregon) or US East (N. Virginia)]` (Choose based on target user base proximity and Supabase availability).
- **Supabase CLI Version:** Ensure all developers and CI/CD use a consistent version (e.g., `^1.150.0`).

## 3. Database Schema (PostgreSQL)

All tables reside in the `public` schema unless stated otherwise. Timestamps use `TIMESTAMPTZ` for time zone awareness. The `handle_updated_at()` trigger function will be applied to all tables with an `updated_at` column.

```sql
-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.1. `users` Table

Stores public profile information, linking to Clerk for authentication.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase auth user ID
    clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk's unique user ID. Indexed for lookups.
    full_name TEXT,
    email TEXT UNIQUE NOT NULL, -- Mirrored from auth.users and Clerk, kept in sync.
    phone_number TEXT, -- Optional, validated format
    linkedin_profile_url TEXT, -- Optional, validated URL format
    portfolio_url TEXT, -- Optional, validated URL format
    current_resume_url TEXT, -- Path to the current primary resume in Supabase Storage
    current_resume_filename TEXT, -- Original filename of the current primary resume
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_clerk_user_id ON public.users(clerk_user_id);

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Function to populate public.users on new auth.users entry from Clerk JWT
-- This function is called by a trigger on auth.users.
-- It assumes Clerk JWT includes necessary claims like `external_id` (Clerk user_id) and `email`.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_clerk()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, clerk_user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'clerk_id', -- IMPORTANT: Ensure Clerk JWT populates this field in raw_user_meta_data
    NEW.email,
    NEW.raw_user_meta_data->>'full_name' -- Optional: if Clerk provides full_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user_from_clerk when a new user signs up via Clerk
CREATE TRIGGER on_auth_user_created_from_clerk
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_from_clerk();
```
**Note on `clerk_user_id` population:** The `handle_new_user_from_clerk` trigger assumes that the Clerk `user_id` is available in `NEW.raw_user_meta_data->>'clerk_id'`. This requires configuring Clerk to pass its `user_id` as a custom claim in the JWT that Supabase verifies. If Clerk uses a different claim name, adjust the trigger accordingly. An alternative is to have an Edge Function called by a Clerk webhook post-user-creation to populate this, ensuring `clerk_user_id` is reliably set.

### 3.2. `user_preferences` Table

Stores detailed job search preferences for each user.

```sql
CREATE TYPE public.employment_type AS ENUM (
    'full-time', 
    'part-time', 
    'contract', 
    'internship', 
    'temporary'
);

CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    preferred_job_titles TEXT[], -- Array of strings, e.g., ["Software Engineer", "Frontend Developer"]
    target_locations JSONB, -- Array of objects: [{ "city": "...", "state": "...", "zip": "...", "remote_only": false, "radius_miles": 10 }]
    salary_min INTEGER CHECK (salary_min >= 0),
    salary_max INTEGER CHECK (salary_max >= 0 AND salary_max >= salary_min),
    salary_currency TEXT DEFAULT 'USD',
    employment_types public.employment_type[],
    industries TEXT[], -- Array of industry names
    key_skills TEXT[], -- Array of key skills, e.g., ["React", "Node.js", "Project Management"]
    work_arrangement public.work_preference_type[], -- e.g., ['remote', 'hybrid'] (defined in PRD as work_preference_type)
    receive_job_alerts BOOLEAN DEFAULT TRUE,
    alert_frequency TEXT DEFAULT 'daily', -- e.g., 'daily', 'weekly', 'instant'
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own job preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.3. `applications` Table

Tracks job applications initiated by users.

```sql
CREATE TYPE public.application_status_type AS ENUM (
    'DRAFT', -- User started but not submitted to Skyvern
    'PENDING_SKYVERN_SUBMISSION', -- App is about to call Skyvern Edge Function
    'PROCESSING_BY_SKYVERN', -- Skyvern task created and is running
    'SUBMITTED_BY_SKYVERN', -- Skyvern confirmed successful submission
    'REQUIRES_ATTENTION_USER_INPUT', -- Skyvern needs more info from user
    'REQUIRES_ATTENTION_MANUAL_REVIEW', -- Skyvern encountered issue, needs manual check
    'FAILED_SKYVERN_SUBMISSION', -- Skyvern could not initiate or complete task (technical error)
    'FAILED_APPLICATION', -- Application was submitted but known to be rejected by portal/company
    'APPLIED_MANUALLY', -- User tracked an application they did outside Jobraker
    'INTERVIEW_SCHEDULED',
    'OFFER_RECEIVED',
    'REJECTED_BY_COMPANY',
    'WITHDRAWN_BY_USER'
);

CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_url TEXT NOT NULL, -- Original job posting URL
    adzuna_job_id TEXT, -- Optional: Adzuna's unique ID for the job
    skyvern_task_id TEXT UNIQUE, -- Skyvern's unique task ID. Indexed for webhook lookups.
    status public.application_status_type DEFAULT 'DRAFT' NOT NULL,
    status_details JSONB, -- Store structured details, e.g., { "reason": "CAPTCHA", "action_prompt": "Please solve CAPTCHA at [URL]" } or { "confirmation_id": "XYZ123" }
    applied_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_status_update_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    notes TEXT, -- User's personal notes
    resume_url_used TEXT, -- Supabase Storage path of the resume version used
    cover_letter_url_used TEXT, -- Optional: Supabase Storage path of cover letter used
    application_source TEXT DEFAULT 'JOBRAKER_AUTOMATED', -- e.g., JOBRAKER_AUTOMATED, MANUAL_ENTRY
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_applications_user_id_status ON public.applications(user_id, status);
CREATE INDEX idx_applications_skyvern_task_id ON public.applications(skyvern_task_id);

CREATE TRIGGER on_applications_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_application_status_update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.last_status_update_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_status_changed
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_application_status_update_timestamp();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.4. `saved_jobs` Table

Allows users to save jobs they are interested in.

```sql
CREATE TABLE public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    adzuna_job_id TEXT, -- Adzuna ID, if sourced from Adzuna
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_url TEXT NOT NULL,
    location TEXT,
    salary_summary TEXT, -- e.g., "$100k - $120k"
    snippet TEXT, -- Short description
    job_details_snapshot JSONB, -- Snapshot of Adzuna job data or other source data at time of save
    saved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    notes TEXT, -- User notes for this saved job
    CONSTRAINT unique_user_job UNIQUE (user_id, job_url) -- Prevent duplicate saves of the same job URL by a user
);

CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.5. `saved_searches` Table

Allows users to save their job search queries and criteria.

```sql
CREATE TABLE public.saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL, -- User-defined name for the search, e.g., "Remote Senior React Roles"
    search_query JSONB NOT NULL, -- Stores keywords and filter criteria (e.g., { "keywords": "React Developer", "location": "Remote", "min_salary": 100000 })
    notify_new_jobs BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ, -- When the search was last executed for notifications
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);

CREATE TRIGGER on_saved_searches_updated
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.6. `notifications` Table

Stores notifications for users (in-app and potentially for push).

```sql
CREATE TYPE public.notification_type AS ENUM (
    'APPLICATION_STATUS_UPDATE',
    'NEW_JOB_MATCH_SAVED_SEARCH',
    'PROFILE_REMINDER',
    'GENERAL_ANNOUNCEMENT'
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID, -- e.g., application_id, saved_search_id
    related_entity_type TEXT, -- e.g., 'application', 'saved_search'
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.7. `resumes` Table (For multiple resume versions - as per PRD Future Enhancements)

```sql
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL, -- Path to the resume in Supabase Storage
    file_name TEXT NOT NULL,
    version_name TEXT, -- e.g., "Software Engineer Resume v2", "Marketing Focused"
    is_primary BOOLEAN DEFAULT FALSE, -- Only one resume can be primary per user
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
-- Ensure only one primary resume per user
CREATE UNIQUE INDEX idx_resumes_user_id_is_primary_true ON public.resumes (user_id) WHERE is_primary = TRUE;

CREATE TRIGGER on_resumes_updated
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own resumes" ON public.resumes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## 4. Supabase Storage Configuration

- **Bucket Name:** `resumes` (for user resume files)
- **Bucket Name:** `cover_letters` (optional, for user cover letter files)
- **Public Access:** Disabled for both buckets. Files accessed via RLS-protected paths or time-limited signed URLs generated by Edge Functions if needed for Skyvern.
- **File Size Limit:** e.g., 5MB per file (configurable in Supabase settings).
- **Allowed MIME Types:** `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `text/plain` (TXT).

### 4.1. Storage Policies (SQL for `resumes` bucket)

```sql
-- Policies for 'resumes' bucket. Similar policies would apply to 'cover_letters' if implemented.

-- Users can upload resumes into their own user-specific folder.
-- Folder structure: {user_id}/{resume_id_or_timestamp}_{original_filename}
CREATE POLICY "Users can upload their resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    owner = auth.uid() -- Ensure owner is set correctly
  );

-- Users can view/download their own resumes.
CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    owner = auth.uid() -- Simplest check: user owns the object
  );

-- Users can update (overwrite) their own resumes.
CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    owner = auth.uid()
  );

-- Users can delete their own resumes.
CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    owner = auth.uid()
  );
```
**Note on Storage Paths:** The `users.current_resume_url` and `resumes.file_url` should store the full path within the bucket, e.g., `{user_id}/{file_id_or_name}`. Skyvern might require a publicly accessible (signed) URL; an Edge Function can generate this. 

## 5. Supabase Realtime Configuration

- **Enabled Tables:** `public.applications`, `public.notifications`.
- **Functionality:**
    - `applications`: Live updates to clients on application status changes.
    - `notifications`: Live delivery of new in-app notifications.
- **Client-side Subscription Example (for `applications`):**
  ```javascript
  // ... Supabase client and user setup ...
  useEffect(() => {
    if (!user || !supabase) return;
    const applicationsChannel = supabase.channel(`db-applications-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Application change received:', payload);
          // Update local state / UI (e.g., Redux store, React Query cache)
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('Subscribed to application updates!');
        if (status === 'CHANNEL_ERROR') console.error('Realtime subscription error:', err);
      });
    return () => { supabase.removeChannel(applicationsChannel); };
  }, [user, supabase]);
  ```

## 6. Authentication Integration (Clerk & Supabase)

- **Clerk as Primary:** Manages user identities, UI, sessions, MFA.
- **Supabase Auth Sync:**
    1. Client authenticates with Clerk, receives Clerk JWT.
    2. Client passes Clerk JWT in `Authorization: Bearer <clerk_jwt>` header to Supabase.
    3. Supabase (configured with Clerk's JWKS URI) verifies JWT.
    4. `auth.uid()` in RLS policies resolves to `sub` claim in Clerk JWT, which is Supabase `auth.users.id`.
- **`public.users` Population:** The `handle_new_user_from_clerk` trigger (section 3.1) creates a corresponding `public.users` record. **Crucial:** Ensure Clerk JWT includes a claim (e.g., `clerk_id` or `external_id`) containing the unique Clerk User ID. This claim name must match what's used in the trigger: `NEW.raw_user_meta_data->>'clerk_id'`. This mapping is configured in Clerk's JWT template settings.

## 7. Supabase Edge Functions

Server-side Deno functions, invoked via HTTPS. All functions should validate the incoming Clerk JWT.

### 7.1. `initiate-skyvern-application`
- **Purpose:** Securely call Skyvern API to start an application, hiding Skyvern API key.
- **Trigger:** Client calls after creating `applications` row with `status = 'PENDING_SKYVERN_SUBMISSION'`.
- **Input:** `{ "application_id": "uuid" }`.
- **Logic:**
    1. Verify user auth (Clerk JWT).
    2. Read `application_id`, retrieve user data and resume URL from `users` and `resumes` tables.
    3. Generate a signed URL for the resume if Skyvern cannot access Supabase Storage directly.
    4. Call Skyvern API with job URL, user data, resume (URL or content based on Skyvern needs).
    5. On Skyvern success: Update `applications` table: `skyvern_task_id`, `status = 'PROCESSING_BY_SKYVERN'`.
    6. On Skyvern failure: Update `applications` table: `status = 'FAILED_SKYVERN_SUBMISSION'`, `status_details` with error.
- **Secrets:** `SKYVERN_API_KEY`.

### 7.2. `skyvern-webhook-handler`
- **Purpose:** Receive asynchronous status updates from Skyvern.
- **Trigger:** Skyvern POSTs to this function's public URL.
- **Input:** Skyvern webhook payload (JSON).
- **Logic:**
    1. **Security:** Verify webhook signature (e.g., using a shared secret with Skyvern, passed in headers and checked against an Edge Function secret). This is CRITICAL.
    2. Parse payload: `skyvern_task_id`, `new_status`, `details`.
    3. Find `applications` record by `skyvern_task_id`.
    4. Update `status` and `status_details`.
    5. If status change is significant (e.g., success, failure, action required), insert a row into `notifications` table for the user and potentially trigger a push notification (see 7.4).
- **Secrets:** `SKYVERN_WEBHOOK_SECRET`.

### 7.3. `adzuna-job-search` (Proxy & Enhancer)
- **Purpose:** Securely query Adzuna API, potentially add caching or merge with internal data.
- **Input:** Search parameters (keywords, location, filters).
- **Logic:**
    1. Verify user auth.
    2. Call Adzuna API with Jobraker's Adzuna API key.
    3. (Optional) Cache results in Supabase tables or Redis to reduce Adzuna calls.
    4. Return job listings to client.
- **Secrets:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`.

### 7.4. `trigger-push-notification`
- **Purpose:** Send push notifications via Expo Push Notification service.
- **Input:** `{ "user_id": "uuid", "title": "string", "message": "string", "data": {} }`.
- **Logic:**
    1. (Internal function, called by other Edge Functions like `skyvern-webhook-handler`).
    2. Retrieve user's Expo Push Token(s) from a (yet to be defined) `user_push_tokens` table.
    3. Construct and send request to Expo Push API.
- **Secrets:** Potentially an Expo Access Token if required for server-side sending.

### 7.5. `generate-resume-signed-url`
- **Purpose:** Provide a temporary, publicly accessible URL for a resume file for Skyvern if it cannot use Supabase client libraries.
- **Input:** `{ "resume_path_in_storage": "string" }`.
- **Logic:**
    1. Verify user auth and that user owns the resume path.
    2. Use Supabase admin rights to generate a signed URL for the object at `resume_path_in_storage`.
    3. Return the signed URL.
- **Secrets:** None directly, but runs with service_role privileges implicitly or explicitly.

## 8. Database Migrations & Management

- **Supabase CLI:** Primary tool.
    - `supabase login`
    - `supabase link --project-ref <your-project-ref>`
    - `supabase db diff -f <migration_name>`: Generate migration from local changes (after using Studio or local PSQL).
    - `supabase migration up`: Apply local migrations to linked remote DB.
    - `supabase db remote changes`: Show differences (use with caution for applying to local).
- **Workflow:**
    1. Develop schema changes locally (Supabase Studio on local instance, or `psql`).
    2. Generate migration file: `supabase db diff --schema public -f my_feature_migration`.
    3. Review and refine the generated SQL migration file.
    4. Test locally: `supabase db reset` (if needed), `supabase migration up`.
    5. Commit migration files to Git.
    6. CI/CD pipeline applies migrations to staging/production: `supabase migration up`.
- **Seeding:** SQL files in `supabase/seed.sql` or custom scripts.

## 9. Backup and Recovery

- **Supabase Managed Backups:** Daily automated backups for projects on paid plans. PITR available.
- **Review Supabase policies:** Understand retention periods and recovery procedures.
- **Manual Backups (Consider for critical milestones):** `pg_dump --dburl "$(supabase status --output json | jq -r .dbUrl)" -Fc --file=jobraker_backup.dump` (run locally after `supabase start`).

## 10. Monitoring and Logging

- **Supabase Dashboard:** API usage, DB health, query performance (via `pg_stat_statements`), Edge Function logs.
- **Custom Logging in Edge Functions:** Use `console.log` for basic logging; consider structured logging for production.
- **External Logging (e.g., Logflare/BetterStack):** Configure Supabase log drains for centralized and advanced log analysis, especially for production environments.

## 11. Security Considerations Specific to Backend

- **RLS is Key:** Double-check all RLS policies to prevent data leakage.
- **Edge Function Security:**
    - Always validate JWTs for user-invoked functions.
    - Secure webhooks (e.g., `skyvern-webhook-handler`) with signature verification using secrets.
    - Sanitize all inputs to prevent injection attacks (SQLi unlikely with Supabase client, but be careful with dynamic queries if any).
    - Use `service_role` key sparingly and only within secure Edge Functions or admin scripts.
- **Secret Management:** Store all API keys, webhook secrets, etc., in Supabase Edge Function secrets or CI/CD environment variables, not in code.
- **Input Validation:** Edge Functions should rigorously validate all incoming data.

## 12. Sign-off
*   **Engineering Lead (Backend Focus):** [Name, Signature, Date]
*   **Security Lead:** [Name, Signature, Date]

*(This document is a living blueprint and will evolve.)*
