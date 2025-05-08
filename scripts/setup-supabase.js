#!/usr/bin/env node

/**
 * Jobraker Supabase Setup Script
 * This script helps set up the Supabase project for Jobraker.
 * It guides you through each step needed to fully integrate Supabase.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

/**
 * Main function to run the setup process
 */
async function runSetup() {
  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${BLUE}    JOBRAKER SUPABASE SETUP SCRIPT     ${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);
  
  console.log(`This script will help you set up your Supabase project for Jobraker.`);
  console.log(`Before continuing, make sure you have:`);
  console.log(`  1. Created a Supabase project at https://supabase.com`);
  console.log(`  2. Created a Clerk project at https://clerk.dev`);
  console.log(`  3. Have your API keys ready for both services\n`);

  await askToContinue();

  // Step 1: Environment variables
  await setupEnvironmentVariables();
  
  // Step 2: Create Supabase database schema
  await setupDatabaseSchema();
  
  // Step 3: Set up Clerk JWT template for Supabase
  await setupClerkJwtTemplate();
  
  // Step 4: Add Edge Functions (optional)
  await askAboutEdgeFunctions();
  
  // Step 5: Final checks
  await finalChecks();
  
  console.log(`\n${GREEN}Setup completed successfully!${RESET}`);
  console.log(`Your Jobraker app is now configured to use Supabase.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Start your development server: ${YELLOW}npx expo start${RESET}`);
  console.log(`  2. Test user registration and sign-in`);
  console.log(`  3. Verify data is being saved to Supabase`);
  
  rl.close();
}

/**
 * Prompt for continuing
 */
async function askToContinue() {
  return new Promise((resolve) => {
    rl.question(`${YELLOW}Press Enter to continue or Ctrl+C to exit...${RESET}`, () => {
      resolve();
    });
  });
}

/**
 * Setup environment variables
 */
async function setupEnvironmentVariables() {
  console.log(`\n${BLUE}STEP 1: Setting Up Environment Variables${RESET}`);
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (fs.existsSync(envPath)) {
    console.log(`${YELLOW}An .env file already exists.${RESET}`);
    const answer = await askQuestion(`Do you want to overwrite it? (y/n): `);
    
    if (answer.toLowerCase() !== 'y') {
      console.log(`Keeping existing .env file.`);
      return;
    }
  }
  
  console.log(`Creating .env file from .env.example...`);
  fs.copyFileSync(envExamplePath, envPath);
  
  console.log(`${GREEN}Environment template created successfully!${RESET}`);
  console.log(`Please open the .env file and fill in your API keys.`);
  
  await askQuestion(`Have you updated the .env file with your API keys? (Press Enter when done): `);
}

/**
 * Setup database schema
 */
async function setupDatabaseSchema() {
  console.log(`\n${BLUE}STEP 2: Setting Up Supabase Database Schema${RESET}`);
  console.log(`For this step, you'll need to run the SQL script in your Supabase dashboard.`);
  console.log(`1. Go to your Supabase project dashboard`);
  console.log(`2. Navigate to the SQL Editor`);
  console.log(`3. Create a new query`);
  console.log(`4. Copy and paste the contents of scripts/supabase-setup.sql`);
  console.log(`5. Run the query`);
  
  await askQuestion(`Have you run the SQL script in your Supabase dashboard? (Press Enter when done): `);
  
  console.log(`${GREEN}Database schema setup completed!${RESET}`);
}

/**
 * Setup Clerk JWT template for Supabase
 */
async function setupClerkJwtTemplate() {
  console.log(`\n${BLUE}STEP 3: Setting Up Clerk JWT Template for Supabase${RESET}`);
  console.log(`You need to configure a JWT template in your Clerk dashboard for Supabase integration.`);
  console.log(`1. Go to your Clerk dashboard`);
  console.log(`2. Navigate to JWT Templates`);
  console.log(`3. Create a template named 'supabase' with the following claims:`);
  console.log(`
{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "user_id": "{{user.id}}"
}
  `);
  
  await askQuestion(`Have you created the JWT template in Clerk? (Press Enter when done): `);
  
  console.log(`${GREEN}Clerk JWT template setup completed!${RESET}`);
}

/**
 * Ask about edge functions
 */
async function askAboutEdgeFunctions() {
  console.log(`\n${BLUE}STEP 4: Setting Up Edge Functions (Optional)${RESET}`);
  console.log(`Supabase Edge Functions can be used for serverless operations like:`);
  console.log(`- Processing webhooks from Skyvern after job application submission`);
  console.log(`- Running scheduled jobs to check application statuses`);
  console.log(`- Implementing server-side logic for sensitive operations`);
  
  const answer = await askQuestion(`Do you want to set up Edge Functions now? (y/n): `);
  
  if (answer.toLowerCase() === 'y') {
    console.log(`\nTo set up Edge Functions:`);
    console.log(`1. Install Supabase CLI: npm install -g supabase`);
    console.log(`2. Link your project: supabase login`);
    console.log(`3. Initialize functions: supabase functions new hello-world`);
    console.log(`4. Deploy function: supabase functions deploy hello-world`);
    
    await askQuestion(`Have you set up the Edge Functions? (Press Enter when done): `);
    console.log(`${GREEN}Edge Functions setup completed!${RESET}`);
  } else {
    console.log(`Skipping Edge Functions setup.`);
  }
}

/**
 * Final checks
 */
async function finalChecks() {
  console.log(`\n${BLUE}STEP 5: Final Checks${RESET}`);
  console.log(`Let's make sure everything is properly configured:`);
  
  console.log(`1. Checking Supabase client configuration...`);
  if (fs.existsSync(path.join(process.cwd(), 'utils', 'supabase.ts'))) {
    console.log(`${GREEN}✓ Supabase client configuration found${RESET}`);
  } else {
    console.log(`${YELLOW}⚠ utils/supabase.ts not found${RESET}`);
  }
  
  console.log(`2. Checking environment variables...`);
  if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    console.log(`${GREEN}✓ .env file exists${RESET}`);
  } else {
    console.log(`${YELLOW}⚠ .env file not found${RESET}`);
  }
  
  console.log(`3. Checking service implementations...`);
  const services = ['userService.ts', 'applicationService.ts', 'storageService.ts'];
  let allServicesExist = true;
  
  for (const service of services) {
    if (fs.existsSync(path.join(process.cwd(), 'services', service))) {
      console.log(`${GREEN}✓ ${service} found${RESET}`);
    } else {
      console.log(`${YELLOW}⚠ services/${service} not found${RESET}`);
      allServicesExist = false;
    }
  }
  
  if (!allServicesExist) {
    console.log(`\n${YELLOW}Some service files are missing. Make sure to implement all required services.${RESET}`);
  }
  
  console.log(`\n${GREEN}Final checks completed!${RESET}`);
}

/**
 * Helper function to ask a question
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the setup
runSetup().catch(console.error);