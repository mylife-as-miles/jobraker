> Edited for use in IDX on 07/09/12

# Jobraker - Job Application Automation App

## Overview

Jobraker is a mobile application that simplifies and automates the job search and application process. It combines job search capabilities with Adzuna and automated application submission through Skyvern to help users apply to jobs with minimal effort.

## Key Features

- **Authentication**: Secure user authentication using Clerk with email and social login options
- **Job Search**: Find relevant job listings through Adzuna API integration
- **Automated Applications**: Submit applications automatically with Skyvern integration
- **Profile Management**: Manage your personal information, resume, and job preferences
- **Application Tracking**: Monitor the status and progress of your job applications

## Technology Stack

- **Frontend**: React Native/Expo with TypeScript
- **Backend-as-a-Service**: Supabase (PostgreSQL database, storage, edge functions)
- **Authentication**: Clerk for user management and JWT-based auth
- **API Integrations**: 
  - Adzuna API for job search and listings
  - Skyvern API for automated application submission
- **UI/UX**: NativeWind (planned), React Native Reanimated, Expo's UI components

## Project Structure

- `/app`: Screens and navigation using Expo Router's file-based routing
  - `/(tabs)`: Main tab screens (Home, Explore, Applications, Profile)
  - `/(onboarding)`: User onboarding flow screens
  - `/profile`: Profile-related screens like edit profile, preferences
- `/components`: Reusable UI components (ThemedText, ThemedView, etc.)
- `/hooks`: Custom React hooks for state management and UI logic
- `/services`: API service classes for Supabase, Adzuna, and Skyvern
- `/utils`: Helper functions including Supabase client configuration
- `/assets`: Static assets including images and fonts
- `/implemention_docs`: Detailed documentation for the project

## Getting Started

### Prerequisites

- Node.js (v16+)
- Expo CLI
- Clerk account and API keys
- Supabase account and API keys

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file with your Supabase and Clerk credentials

### Running the App

```bash
npx expo start
```

## Development

The Jobraker app follows a phased implementation approach as outlined in the implementation documents located in `/implemention_docs`. Development is guided by detailed specifications in `app_flow.md`, `backend_structure.md`, and `blueprint.md`.

### Current Status (May 8, 2025)

The app currently has the following features implemented:
- Complete navigation structure with tabs and proper routing
- Authentication with Clerk (sign-in, sign-up, sign-out)
- User onboarding flow with multi-step profile setup
- Applications tracking UI with status visualization
- Profile management with resume upload capabilities
- Proper theme support (light/dark mode)

### Next Steps

- Complete Supabase backend integration
  - Set up database tables as defined in backend_structure.md
  - Implement Row Level Security policies
  - Configure storage for resumes
- Implement Adzuna API integration for job search
- Set up Skyvern automated application submission
- Enhance application tracking with real-time updates
- Add analytics dashboard for application metrics

## Documentation

Detailed documentation is available in the `/implemention_docs` folder:
- `Jobraker_PRD.markdown`: Product Requirements Document
- `app_flow.md`: User flows and screen descriptions
- `backend_structure.md`: Database schema and backend configuration
- `blueprint.md`: Technical blueprint and system design
- `tech_stack.md`: Technology stack details

## License

[License information goes here]
