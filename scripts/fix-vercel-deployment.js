#!/usr/bin/env node

/**
 * Fix Vercel Deployment Issues
 *
 * This script helps diagnose and fix common Vercel deployment issues:
 * 1. Missing environment variables
 * 2. Database connection problems
 * 3. API endpoint configuration
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

console.log("🔧 Vercel Deployment Fix Script\n");

// Required environment variables for production
const requiredEnvVars = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_ANON_KEY",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ADMIN_JWT_SECRET",
  "SESSION_SECRET",
];

console.log("📋 Step 1: Checking required environment variables...\n");

// Check if Vercel CLI is installed
async function checkVercelCLI() {
  try {
    await execAsync("vercel --version");
    console.log("✅ Vercel CLI is installed");
    return true;
  } catch (error) {
    console.log("❌ Vercel CLI not found. Please install it:");
    console.log("   npm install -g vercel");
    return false;
  }
}

// Set environment variables in Vercel
async function setVercelEnvVars() {
  console.log("\n🔧 Step 2: Setting up Vercel environment variables...\n");

  console.log(
    "Please set these environment variables in your Vercel Dashboard:"
  );
  console.log(
    "https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n"
  );

  console.log("Required Variables:");
  console.log("─".repeat(60));

  // Database Configuration
  console.log("📊 Database Configuration:");
  console.log(
    "DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres"
  );
  console.log("SUPABASE_URL=https://your-project-id.supabase.co");
  console.log("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here");
  console.log("VITE_SUPABASE_ANON_KEY=your_anon_key_here");
  console.log("");

  // JWT Secrets
  console.log("🔐 JWT & Security Secrets:");
  console.log("JWT_SECRET=your_secure_jwt_secret_min_32_chars");
  console.log("JWT_REFRESH_SECRET=your_secure_refresh_secret_min_32_chars");
  console.log("ADMIN_JWT_SECRET=your_secure_admin_secret_min_32_chars");
  console.log("SESSION_SECRET=your_secure_session_secret_min_32_chars");
  console.log("");

  // Optional
  console.log("🔧 Optional (for additional features):");
  console.log("GEMINI_API_KEY=your_gemini_api_key_for_ai_features");
  console.log("RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key");
  console.log("");

  console.log("📝 How to generate secure secrets:");
  console.log("Run this command 4 times to generate the JWT secrets:");
  console.log("openssl rand -base64 32");
  console.log("");
}

// Test database connection
async function testDatabaseConnection() {
  console.log("🔍 Step 3: Testing database connection...\n");

  if (!process.env.DATABASE_URL) {
    console.log(
      "❌ DATABASE_URL not set. Please set it in your environment or .env file"
    );
    return false;
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const schema = await import("../shared/schema.js");

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    // Test connection
    const result = await db.select().from(schema.subjects).limit(1);
    console.log("✅ Database connection successful");
    console.log(`   Found ${result.length} subjects in database`);
    return true;
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
    console.log(
      "   Please check your DATABASE_URL and ensure the database is accessible"
    );
    return false;
  }
}

// Deploy to Vercel
async function deployToVercel() {
  console.log("\n🚀 Step 4: Deploying to Vercel...\n");

  try {
    console.log("Building application...");
    await execAsync("npm run build");
    console.log("✅ Build completed successfully");

    console.log("Deploying to Vercel...");
    const { stdout } = await execAsync("vercel --prod");
    console.log("✅ Deployment completed successfully");
    console.log("🌐 Deployment URL:", stdout.trim());

    return true;
  } catch (error) {
    console.log("❌ Deployment failed:", error.message);
    return false;
  }
}

// Test production endpoints
async function testProductionEndpoints(deploymentUrl) {
  console.log("\n🧪 Step 5: Testing production endpoints...\n");

  const endpoints = [
    "/api/health",
    "/api/subjects",
    "/api/stats",
    "/api/categories",
    "/api/exams",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${deploymentUrl}${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log("🎯 This script will help you fix Vercel deployment issues\n");

  // Check Vercel CLI
  const hasVercelCLI = await checkVercelCLI();
  if (!hasVercelCLI) {
    process.exit(1);
  }

  // Show environment variables setup
  await setVercelEnvVars();

  // Test database connection (if env vars are set locally)
  await testDatabaseConnection();

  console.log("\n📋 Next Steps:");
  console.log("1. Set all required environment variables in Vercel Dashboard");
  console.log("2. Run: npm run build");
  console.log("3. Run: vercel --prod");
  console.log("4. Test your endpoints");
  console.log("");
  console.log("📖 For detailed instructions, see:");
  console.log("   - BUILD_INSTRUCTIONS.md");
  console.log("   - VERCEL_DEPLOYMENT_GUIDE.md");
  console.log("");
  console.log("🆘 If you continue having issues:");
  console.log("   - Check Vercel function logs in dashboard");
  console.log("   - Verify DATABASE_URL is accessible from Vercel");
  console.log("   - Ensure all environment variables are set for Production");
}

// Run the script
main().catch(console.error);
