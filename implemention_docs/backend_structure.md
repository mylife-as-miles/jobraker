# Jobraker Backend Structure & Supabase Configuration

**Version:** 2.0
**Last Updated:** May 7, 2025
**Status:** Draft
**Owner:** Engineering Lead (Backend Focus)
**Stakeholders:** Engineering Lead (Frontend Focus), Product Management

## 0. Document History
| Version | Date       | Author          | Changes                                                                                                                                  |
|---------|------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | Apr 28, 2025| [Previous Author] | Initial outline of Supabase tables                                                                                                       |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: Detailed schema, RLS policies, Storage config, Realtime setup, Edge Functions, Auth integration, and migration strategy |

## 1. Introduction

This document details the backend structure of the Jobraker application, specifically focusing on its implementation using Supabase. It covers database schema, Row Level Security (RLS) policies, storage configuration, real-time capabilities, authentication integration with Clerk, and potential use of Supabase Edge Functions. This document is a companion to `blueprint.md` and `tech_stack.md`.

## 2. Supabase Project Setup

- **Project URL:** `[Your Supabase Project URL]` (e.g., `https://xyz.supabase.co`)
- **API Key (anon, public):** Stored in client-side environment variables.
- **API Key (service_role, secret):** Stored securely in backend environments (e.g., for CI/CD, admin scripts, Edge Functions if they need elevated privileges - use with extreme caution).
- **Region:** `[Your Chosen Supabase Region]` (e.g., US West, EU Central)

## 3. Database Schema (PostgreSQL)

Below are the detailed SQL definitions for the tables within the `public` schema. All `user_id` fields referencing user identity will point to `auth.users(id)` which is automatically populated by Supabase when a user signs up, and linked via Clerk integration.

### 3.1. `users` Table

This table stores public profile information for users. Sensitive authentication data is managed by Clerk and linked via `auth.users`.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT UNIQUE NOT NULL, -- From Clerk, for cross-referencing if needed
    full_name TEXT,
    email TEXT UNIQUE NOT NULL, -- Mirrored from auth.users for convenience, kept in sync
    phone_number TEXT,
    current_location TEXT, -- e.g., "San Francisco, CA" or "Remote"
    resume_url TEXT, -- Path to the resume in Supabase Storage
    resume_filename TEXT, -- Original filename of the uploaded resume
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Note: User creation is handled by Clerk/Supabase auth. New rows in public.users
-- should be created via a trigger on auth.users or a function called post-Clerk signup.
-- Example trigger to populate public.users on new auth.users entry:
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, clerk_user_id, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'user_id', NEW.email); -- Assumes Clerk user_id is in raw_user_meta_data
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

```

### 3.2. `job_preferences` Table

Stores user-defined preferences for job searches.

```sql
CREATE TYPE public.work_preference_type AS ENUM ('remote', 'on-site', 'hybrid');

CREATE TABLE public.job_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    job_titles TEXT[], -- Array of preferred job titles
    key_skills TEXT[], -- Array of key skills
    preferred_locations TEXT[], -- Array of preferred locations (can include "Remote")
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    work_type public.work_preference_type,
    receive_email_notifications BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for job_preferences table
CREATE TRIGGER on_job_preferences_updated
  BEFORE UPDATE ON public.job_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for job_preferences table
ALTER TABLE public.job_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job preferences" ON public.job_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.3. `applications` Table

Tracks job applications made by users through the app.

```sql
CREATE TYPE public.application_status_type AS ENUM (
    'draft', -- Application details saved but not yet submitted to Skyvern
    'pending_submission', -- Submitted to Skyvern, awaiting processing
    'processing', -- Skyvern is actively working on it
    'submitted_successfully', -- Skyvern confirmed successful submission
    'failed_submission', -- Skyvern reported a failure
    'action_required', -- Skyvern requires manual intervention (e.g., CAPTCHA)
    'viewed_by_employer', -- (If trackable)
    'interview_scheduled', 
    'offer_received',
    'rejected_by_employer',
    'withdrawn_by_user'
);

CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_url TEXT NOT NULL, -- URL of the job posting
    adzuna_job_id TEXT, -- Optional: If sourced from Adzuna
    skyvern_task_id TEXT, -- ID from Skyvern API for tracking automation task
    application_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    status public.application_status_type DEFAULT 'draft' NOT NULL,
    status_reason TEXT, -- Optional: More details on failure or action required
    last_status_update TIMESTAMPTZ DEFAULT now() NOT NULL,
    notes TEXT, -- User's personal notes about this application
    resume_url_used TEXT, -- Path to the specific resume version used for this application
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_skyvern_task_id ON public.applications(skyvern_task_id);

-- Trigger for applications table
CREATE TRIGGER on_applications_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Function to update last_status_update timestamp when status changes
CREATE OR REPLACE FUNCTION public.handle_status_update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.last_status_update = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_status_changed
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_status_update_timestamp();

-- RLS Policies for applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

```

### 3.4. `skyvern_tasks_log` Table (Optional, for detailed logging)

If more granular logging of Skyvern interactions is needed beyond what's in the `applications` table.

```sql
-- Optional: For detailed logging of Skyvern API interactions
CREATE TABLE public.skyvern_tasks_log (
    id BIGSERIAL PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    skyvern_task_id TEXT NOT NULL,
    request_payload JSONB, -- What was sent to Skyvern
    response_payload JSONB, -- What was received from Skyvern
    status_code INTEGER, -- HTTP status code from Skyvern
    event_type TEXT, -- e.g., 'task_created', 'status_update', 'error'
    log_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: Typically, only service_role or specific admin roles would access this directly.
-- Users would see a curated status via the 'applications' table.
ALTER TABLE public.skyvern_tasks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage Skyvern logs" ON public.skyvern_tasks_log
  FOR ALL USING (current_setting('request.role', true) = 'service_role');
```

## 4. Supabase Storage Configuration

- **Bucket Name:** `resumes`
- **Public Access:** Should be **disabled**. Files accessed via signed URLs or through RLS-protected paths.
- **File Size Limit:** Configured as needed (e.g., 5MB per resume).
- **Allowed MIME Types:** `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX).

### 4.1. Storage Policies (SQL)

```sql
-- Ensure the bucket exists and is private
-- This is typically done via Supabase Studio UI or CLI, but policies control access.

-- Allow authenticated users to upload resumes into their own user-specific folder.
-- Folder structure: {user_id}/{timestamp}_{original_filename}
CREATE POLICY "Users can upload their own resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text -- Ensures upload is to a folder named with their user_id
    -- AND (storage.filename(name) ~ '^[0-9]+_.*\.(pdf|docx)$' ) -- Optional: regex for filename pattern
  );

-- Allow users to view/download their own resumes.
CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update (overwrite) their own resumes.
CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own resumes.
CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 5. Supabase Realtime Configuration

- **Enabled Tables:** `public.applications`.
- **Functionality:** Used to provide live updates to the client when the `status` of an application changes.
- **Client-side Subscription:** The mobile app will subscribe to changes on the `applications` table, filtered by the current `user_id`.
  ```javascript
  // Example client-side code (React hook)
  // const { supabase } = useSupabaseClient(); // Or however Supabase client is accessed
  // const user = useUser(); // From Clerk
  
  // useEffect(() => {
  //   if (!user || !supabase) return;
  
  //   const channel = supabase.channel(`applications-user-${user.id}`)
  //     .on(
  //       'postgres_changes',
  //       { 
  //         event: 'UPDATE', 
  //         schema: 'public', 
  //         table: 'applications', 
  //         filter: `user_id=eq.${user.id}` 
  //       },
  //       (payload) => {
  //         console.log('Application updated:', payload.new);
  //         // dispatch action to update local state / UI
  //       }
  //     )
  //     .subscribe((status, err) => {
  //       if (status === 'SUBSCRIBED') {
  //         console.log('Subscribed to application updates!');
  //       } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
  //         console.error('Realtime subscription error:', err);
  //       }
  //     });
  
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [user, supabase]);
  ```

## 6. Authentication Integration (Clerk & Supabase)

- **Clerk as Primary Auth Provider:** Manages user identities, sign-up/sign-in flows, MFA, social logins.
- **Supabase Auth Sync:** Clerk JWTs are used to authenticate requests to Supabase.
    1.  User signs in via Clerk on the mobile app.
    2.  Clerk SDK provides a JWT.
    3.  This JWT is passed in the `Authorization` header (Bearer token) for all Supabase API calls.
    4.  Supabase is configured with Clerk's JWKS (JSON Web Key Set) URI to verify the signature of incoming JWTs.
    5.  The `auth.uid()` function in Supabase RLS policies will correctly resolve to the user's ID from the verified Clerk JWT.
- **`public.users` Table Population:** As shown in section 3.1, a trigger `on_auth_user_created` on `auth.users` table populates the `public.users` table with essential details when a new user is created via Clerk.
    *   The `raw_user_meta_data` field in `auth.users` (populated by Clerk) might need to be configured in Clerk to include the Clerk `user_id` if it's not there by default, or use a mapping if Clerk provides a different mechanism to link its user ID to the Supabase `auth.users.id`.

## 7. Supabase Edge Functions

Edge Functions provide server-side logic deployed close to users. They are suitable for:

### 7.1. API Key Masking / Secure Proxy for Third-Party APIs
- **Skyvern API Proxy:**
    - **Purpose:** To avoid exposing the Skyvern API key in the mobile client.
    - **Function Name:** `skyvern-proxy`
    - **Logic:**
        1. Receives request from mobile client (authenticated via Clerk JWT).
        2. Validates user and request parameters.
        3. Retrieves Skyvern API key from environment variables (set within Supabase Edge Function settings).
        4. Forwards the request to the actual Skyvern API with the API key.
        5. Returns Skyvern's response to the mobile client.
    - **Invocation:** Client calls `supabase.functions.invoke('skyvern-proxy', { body: { ... } })`.
- **Adzuna API Proxy (Optional):**
    - **Purpose:** If Adzuna API keys need to be hidden or if server-side caching/rate limiting for Adzuna is desired.
    - **Function Name:** `adzuna-proxy`

### 7.2. Webhook Handlers
- **Skyvern Status Webhooks (If Skyvern supports this):**
    - **Purpose:** Allow Skyvern to push application status updates to Jobraker directly, rather than relying solely on polling.
    - **Function Name:** `skyvern-webhook-handler`
    - **Logic:**
        1. Receives webhook from Skyvern (requires a secret for verification).
        2. Parses payload, identifies `skyvern_task_id`.
        3. Updates the corresponding record in the `public.applications` table (using `service_role` key for elevated privileges, carefully scoped).

### 7.3. Complex Data Operations
- **Custom Analytics Aggregation (If client-side becomes too slow/complex):**
    - **Purpose:** Perform complex joins or aggregations for the analytics dashboard that are inefficient for the client to do directly.
    - **Function Name:** `get-user-analytics`

### 7.4. Environment Variables for Edge Functions
- API keys (Skyvern, Adzuna if proxied) and other secrets are set via the Supabase Dashboard (Project Settings > Edge Functions > [Function Name] > Secrets).

## 8. Database Migrations & Management

- **Supabase CLI:** Used for managing database schema changes.
    - `supabase migrations new <migration_name>`: Creates a new migration file.
    - `supabase db push` (Local dev with Supabase Docker): Applies local migrations.
    - `supabase link --project-ref <your-project-ref>`
    - `supabase db remote commit` (Not recommended for production directly; use migration files).
    - `supabase migrations up` (Applies pending migrations to linked Supabase project).
- **Migration Workflow:**
    1. Develop schema changes locally (e.g., using Supabase Studio or SQL tools against a local Supabase instance).
    2. Generate migration files using `supabase migrations new ...` and edit the SQL.
    3. Test migrations locally.
    4. Commit migration files to version control (Git).
    5. Apply migrations to staging/production Supabase instances via CI/CD pipeline (`supabase migrations up`).
- **Seeding Data:** Use SQL scripts or Supabase CLI for seeding initial or test data.

## 9. Backup and Recovery

- **Supabase Managed Backups:** Supabase automatically handles point-in-time recovery (PITR) for projects on paid plans. Review Supabase documentation for specifics on backup frequency and retention.
- **Manual Backups (Optional):** For additional peace of mind or specific requirements, `pg_dump` can be used with direct database connection credentials (obtained from Supabase settings).

## 10. Monitoring and Logging (Supabase)

- **Supabase Dashboard:** Provides insights into API usage, database health, query performance, and logs for Edge Functions.
- **Logflare/External Logging:** Supabase allows integration with external logging providers for more advanced log management and analysis.

## 11. Sign-off
*   **Engineering Lead (Backend Focus):** [Name, Signature, Date]
*   **Engineering Lead (Frontend Focus):** [Name, Signature, Date]

*(This document outlines the core backend structure and will be refined as development progresses.)*
