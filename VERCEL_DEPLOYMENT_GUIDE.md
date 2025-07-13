# Vercel Deployment Guide for Brainliest Platform

## Overview
This guide covers deploying the Brainliest exam preparation platform to Vercel with Supabase database integration and data seeding.

## Prerequisites
- Vercel account with CLI installed
- Supabase project with connection strings
- GitHub repository (recommended for continuous deployment)

## Database Migration Strategy

### Option 1: Direct Supabase Migration (Recommended)
Since you're using Supabase, the database is already hosted and ready. You just need to:

1. **Configure Environment Variables in Vercel**
2. **Deploy the Application**
3. **Seed Data via API Endpoints**

### Option 2: Database Migration Scripts
Use the provided migration scripts to set up a fresh database.

## Step 1: Vercel Environment Configuration

### 1.1 Add Environment Variables to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL
# Paste: postgres://postgres.bnjpjfwdcydjraagdlxb:STELCNmg0bPv0tiM@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

vercel env add SUPABASE_URL
# Paste: https://bnjpjfwdcydjraagdlxb.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: your_service_role_key

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: your_anon_key

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: your_anon_key

vercel env add SUPABASE_JWT_SECRET
# Paste: your_jwt_secret

vercel env add POSTGRES_USER production
vercel env add POSTGRES_HOST production
vercel env add POSTGRES_PASSWORD production
vercel env add POSTGRES_DATABASE production
```

### 1.2 Alternative: Environment Variables via Dashboard

Go to your Vercel project dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgres://postgres.bnjpjfwdcydjraagdlxb:STELCNmg0bPv0tiM@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
SUPABASE_URL=https://bnjpjfwdcydjraagdlxb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
POSTGRES_USER=postgres
POSTGRES_HOST=db.bnjpjfwdcydjraagdlxb.supabase.co
POSTGRES_PASSWORD=your_password_here
POSTGRES_DATABASE=postgres
```

## Step 2: Database Schema Deployment

### 2.1 Using Drizzle Push (Recommended)
```bash
# Push schema changes to production database
npm run db:push
```

### 2.2 Using Migration Scripts
```bash
# Run the complete migration script
node scripts/deploy-to-remote.sh
```

## Step 3: Data Seeding Options

### 3.1 Automatic Seeding via API
The application includes automatic seeding when the server starts:

```typescript
// Server automatically checks and seeds data on startup
// Location: server/src/index.ts
```

### 3.2 Manual Seeding via SQL Script
```bash
# Use the comprehensive migration script
psql $DATABASE_URL -f migrations/supabase-export.sql
```

### 3.3 JSON Import via Admin Panel
1. Deploy the application
2. Access the admin panel
3. Use the JSON import feature with the provided template

## Step 4: Vercel Deployment

### 4.1 Deploy via CLI
```bash
# Deploy to Vercel
vercel --prod

# Or for first deployment
vercel
```

### 4.2 Deploy via GitHub Integration
1. Connect your GitHub repository to Vercel
2. Push code to main branch
3. Vercel automatically deploys

### 4.3 Build Configuration
Your `vercel.json` is already configured:

```json
{
  "buildCommand": "node scripts/vercel-build.js",
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

## Step 5: Post-Deployment Verification

### 5.1 Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 5.2 API Endpoints Test
```bash
# Test subjects endpoint
curl https://your-app.vercel.app/api/subjects

# Test stats endpoint
curl https://your-app.vercel.app/api/stats

# Test trending endpoint
curl https://your-app.vercel.app/api/trending/certifications
```

### 5.3 Database Verification
```bash
# Check data count
curl https://your-app.vercel.app/api/stats
# Should return: {"subjects":"23","exams":"17","questions":"32","successRate":95}
```

## Step 6: Data Seeding Scripts

### 6.1 Quick Seed Script
```bash
# Create a quick seeding script
node scripts/seed-vercel-production.js
```

### 6.2 Comprehensive Migration
```bash
# Use the complete database export
psql $DATABASE_URL -f migrations/supabase-export.sql
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Verify all variables are set in Vercel dashboard
   - Redeploy after adding new variables

2. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify Supabase project is active
   - Ensure connection string includes SSL mode

3. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in package.json
   - Ensure TypeScript compilation passes

4. **Empty Database**
   - Run seeding scripts manually
   - Check migration logs
   - Verify RLS policies allow data insertion

### Support Resources
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Project-specific help: Check server logs in Vercel dashboard

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Vercel's secure environment variable storage
   - Rotate keys periodically

2. **Database Security**
   - RLS policies are enabled
   - Service role key is protected
   - Connection uses SSL encryption

3. **API Security**
   - Rate limiting is configured
   - CORS policies are set
   - Input validation is implemented

This guide ensures a secure, scalable deployment of your Brainliest platform on Vercel with proper database integration and data seeding.