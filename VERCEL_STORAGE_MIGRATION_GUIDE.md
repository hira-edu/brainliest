# Quick Vercel Deployment & Supabase Database Guide

## 📋 Prerequisites Checklist
- ✅ Vercel CLI installed (`npm i -g vercel`)
- ✅ Supabase project created and configured
- ✅ Supabase database credentials available (you already have these)

**Technical Note**: This project uses an HTTP PostgreSQL adapter (`@neondatabase/serverless`) that works with any PostgreSQL database, including Supabase. Despite the package name, it's a standard HTTP PostgreSQL client, not limited to Neon databases.

## 🚀 Step-by-Step Deployment

### Step 1: Install Vercel CLI & Login
```bash
npm i -g vercel
vercel login
```

### Step 2: Set Environment Variables in Vercel
You can do this via CLI or Vercel Dashboard. Here are your exact variables:

#### Option A: Via Vercel CLI
```bash
# Navigate to your project directory first
cd your-project-directory

# Add each environment variable
vercel env add DATABASE_URL production
# Paste: postgres://postgres.bnjpjfwdcydjraagdlxb:STELCNmg0bPv0tiM@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

vercel env add SUPABASE_URL production
# Paste: https://bnjpjfwdcydjraagdlxb.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuanBqZndkY3lkanJhYWdkbHhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA5NzM4NywiZXhwIjoyMDY3NjczMzg3fQ.K4LjF9EzxsYoRPCiSnuNKfnbrLXfZ3KElrUVB68GJAg

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuanBqZndkY3lkanJhYWdkbHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwOTczODcsImV4cCI6MjA2NzY3MzM4N30.wGjJgPlRp0VxUIsIeFMg_NjJeK3GXUjlrYvr2apftEA

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuanBqZndkY3lkanJhYWdkbHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwOTczODcsImV4cCI6MjA2NzY3MzM4N30.wGjJgPlRp0VxUIsIeFMg_NjJeK3GXUjlrYvr2apftEA

vercel env add SUPABASE_JWT_SECRET production
# Paste: 2Pc/6W6ewYQiovoEdYT7NR/mPRUhypTAyFt9MU3RGzL3BbpM9z8EX0GJLIGs3HDD3YDMuGkgV/B8VQx8lJYyrA==

vercel env add POSTGRES_USER production
# Type: postgres

vercel env add POSTGRES_HOST production
# Type: db.bnjpjfwdcydjraagdlxb.supabase.co

vercel env add POSTGRES_PASSWORD production
# Type: STELCNmg0bPv0tiM

vercel env add POSTGRES_DATABASE production
# Type: postgres
```

#### Option B: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (or import from GitHub)
3. Go to Settings → Environment Variables
4. Add the variables listed above

### Step 3: Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# If it's your first deployment
vercel
```

### Step 4: Seed Database (3 Options)

#### Option A: Use Existing Complete Migration (Recommended)
```bash
# Use the comprehensive SQL file with all data
psql "postgres://postgres.bnjpjfwdcydjraagdlxb:STELCNmg0bPv0tiM@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" -f migrations/supabase-export.sql
```

#### Option B: Use Drizzle Push + Manual Seeding
```bash
# Push schema to Supabase production database
npm run db:push

# Run the Supabase production seeding script
node scripts/seed-vercel-production.js
```

#### Option C: Setup Script (Supabase Database + Seeding)
```bash
# Run the comprehensive Supabase setup
node scripts/vercel-db-setup.js
```

### Step 5: Verify Deployment
After deployment, test your endpoints:

```bash
# Replace 'your-app' with your actual Vercel app name
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/subjects
curl https://your-app.vercel.app/api/stats
```

Expected response for `/api/stats`:
```json
{"subjects":"23","exams":"17","questions":"32","successRate":95}
```

## 🔧 Manual Database Setup (If Needed)

If your database is empty, you can populate it manually:

### Schema Setup
```bash
# Connect to your database and run
npm run db:push
```

### Data Seeding
```bash
# Seed production data
node scripts/seed-vercel-production.js
```

### Complete Migration
```bash
# Use the full export file
psql $DATABASE_URL -f migrations/supabase-export.sql
```

## 🚨 Troubleshooting

### Environment Variables Not Working
- Redeploy after adding new variables: `vercel --prod`
- Check variable names exactly match (case-sensitive)
- Verify variables are set for "Production" environment

### Database Connection Issues
- Verify DATABASE_URL is exactly correct
- Check Supabase project is active
- Ensure SSL mode is included in connection string

### Build Failures
- Check build logs in Vercel dashboard
- Verify all TypeScript files compile locally
- Ensure all dependencies are installed

### Empty Database
- Run seeding scripts manually
- Check RLS policies allow data insertion
- Verify connection string has write permissions

## 💡 Quick Commands Reference

```bash
# Environment setup
vercel env add VARIABLE_NAME production

# Deploy
vercel --prod

# Seed database
node scripts/seed-vercel-production.js

# Full migration
psql $DATABASE_URL -f migrations/supabase-export.sql

# Test deployment
curl https://your-app.vercel.app/api/health
```

## 📊 Expected Results

After successful deployment and seeding:
- ✅ 6 categories
- ✅ 6 subcategories  
- ✅ 23 subjects
- ✅ 17 exams
- ✅ 32 questions
- ✅ User interaction data for trending

Your Brainliest platform will be fully functional with all exam content and analytics!