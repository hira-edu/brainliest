# 🚨 Deployment Issues Fix Guide

## Overview
This guide addresses the critical issues found in your Vercel deployment logs and provides step-by-step solutions.

## 🔍 Issues Identified

### 1. **Database Connection Failures**
**Error**: `NeonDbError: Error connecting to database: fetch failed`
**Status**: ❌ Critical - All API endpoints failing

### 2. **Missing API Endpoints**
**Error**: `404 errors for /api/stats`
**Status**: ✅ Fixed - Added comprehensive API endpoints

### 3. **Missing Database Tables**
**Error**: `relation "users" does not exist`
**Status**: ❌ Critical - Database schema incomplete

### 4. **Auth System Issues**
**Error**: `column "email" of relation "auth_logs" does not exist`
**Status**: ❌ Critical - Authentication system broken

---

## 🎯 **IMMEDIATE FIXES**

### Step 1: Fix Environment Variables in Vercel

**Go to Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **REQUIRED** variables:

```env
# Database Configuration (CRITICAL)
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_secure_refresh_secret_min_32_chars
ADMIN_JWT_SECRET=your_secure_admin_secret_min_32_chars
SESSION_SECRET=your_secure_session_secret_min_32_chars

# Node Environment
NODE_ENV=production
```

### Step 2: Fix Database Schema

**The database is missing critical tables. Run these commands:**

```bash
# 1. Connect to your Supabase database
psql "your_database_connection_string"

# 2. Create missing users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    role VARCHAR(50) DEFAULT 'user',
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    registration_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

# 3. Fix auth_logs table structure
DROP TABLE IF EXISTS auth_logs;
CREATE TABLE auth_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

# 4. Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

# 5. Create anon_question_sessions table with correct structure
DROP TABLE IF EXISTS anon_question_sessions;
CREATE TABLE anon_question_sessions (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    user_agent_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Apply Database Migrations

**Option A: Using Supabase CLI (Recommended)**
```bash
# Push all migrations to production
supabase db push --include-all

# Apply the seed data
supabase db reset --db-url "your_database_connection_string"
```

**Option B: Using SQL Migration Files**
```bash
# Apply the complete migration
psql "your_database_connection_string" -f supabase/migrations/20241225000001_initial_schema.sql
psql "your_database_connection_string" -f supabase/migrations/20241225000002_add_missing_tables.sql
psql "your_database_connection_string" -f supabase/seed-with-users-fixed.sql
```

### Step 4: Redeploy Application

```bash
# 1. Rebuild the application
npm run build

# 2. Deploy to Vercel
vercel --prod

# 3. Test the deployment
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/stats
curl https://your-app.vercel.app/api/subjects
```

---

## 🔧 **DETAILED FIXES**

### Fix 1: IP Address Processing Issue

**Error**: `ipaddr.process is not a function`

**Solution**: Update the IP address processing in `server/src/services/freemium-service.ts`:

```typescript
// Replace the problematic IP processing
function normalizeIpAddress(ip: string): string {
  try {
    // Simple IP validation and normalization
    const cleanIp = ip.replace(/^::ffff:/, ''); // Remove IPv6 prefix
    
    // Basic IP format validation
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) {
      return '127.0.0.1'; // Fallback to localhost
    }
    
    return cleanIp;
  } catch (error) {
    console.error('IP normalization error:', error);
    return '127.0.0.1';
  }
}
```

### Fix 2: Database Connection String Format

**Your DATABASE_URL should be in this format:**
```
postgresql://postgres:password@db.project-id.supabase.co:5432/postgres
```

**NOT this format:**
```
postgresql://postgres:password@host:6543/postgres?sslmode=require&supa=base-pooler.x
```

### Fix 3: Missing API Endpoints

**Status**: ✅ **FIXED** - Updated `api/index.js` with all endpoints:
- `/api/health` - Health check
- `/api/stats` - Platform statistics
- `/api/subjects` - Subject management
- `/api/categories` - Category management
- `/api/subcategories` - Subcategory management
- `/api/exams` - Exam management
- `/api/questions` - Question management
- `/api/comments` - Comment management
- `/api/trending/certifications` - Trending data

---

## 🧪 **TESTING YOUR FIXES**

### Test 1: Database Connection
```bash
# Test database connection locally
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon('your_database_url');
sql\`SELECT 1\`.then(() => console.log('✅ Database connected')).catch(console.error);
"
```

### Test 2: API Endpoints
```bash
# Test all critical endpoints
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/stats
curl https://your-app.vercel.app/api/subjects
curl https://your-app.vercel.app/api/categories
```

### Test 3: Frontend Functionality
1. Visit your deployed app
2. Check if the main page loads
3. Test navigation between subjects
4. Verify question interface works

---

## 📊 **VERIFICATION CHECKLIST**

After applying fixes, verify:

- [ ] ✅ API endpoints return 200 status codes
- [ ] ✅ Database tables exist and are populated
- [ ] ✅ Environment variables are set in Vercel
- [ ] ✅ Frontend loads without errors
- [ ] ✅ Navigation works correctly
- [ ] ✅ Question interface is functional
- [ ] ✅ Statistics are displaying correctly

---

## 🆘 **TROUBLESHOOTING**

### Still Getting Database Errors?
1. **Check Supabase Dashboard** - Ensure project is active
2. **Verify Connection String** - Test with a simple SELECT query
3. **Check Firewall** - Ensure Vercel IPs can access your database
4. **Review Logs** - Check Vercel function logs for detailed errors

### Still Getting 404 Errors?
1. **Check Vercel Routes** - Verify `vercel.json` configuration
2. **Check Build Output** - Ensure `api/index.js` is in the build
3. **Check Function Logs** - Look for deployment errors in Vercel dashboard

### Environment Variables Not Working?
1. **Check Environment** - Ensure variables are set for "Production"
2. **Redeploy** - Environment changes require redeployment
3. **Check Naming** - Ensure exact variable names match

---

## 🎯 **QUICK DEPLOYMENT SCRIPT**

Run this script to fix and deploy:

```bash
#!/bin/bash

echo "🚀 Quick Deployment Fix Script"

# 1. Install dependencies
npm install

# 2. Build application
npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Test deployment
echo "Testing deployment..."
curl -s https://your-app.vercel.app/api/health | grep -q "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"
curl -s https://your-app.vercel.app/api/stats | grep -q "subjects" && echo "✅ Stats endpoint working" || echo "❌ Stats endpoint failed"

echo "🎉 Deployment complete!"
```

---

## 📞 **SUPPORT**

If you continue experiencing issues:

1. **Check Vercel Function Logs** - Most detailed error information
2. **Review Supabase Logs** - Database connection issues
3. **Test Locally First** - Ensure everything works in development
4. **Environment Variables** - Double-check all required variables are set

**Remember**: Most deployment issues are related to environment variables or database connectivity. Fix these first before investigating other issues. 