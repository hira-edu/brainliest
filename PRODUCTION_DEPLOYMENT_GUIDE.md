# 🚀 **Production Deployment - Mirror Local Setup**

## 📋 **Overview**

This guide will help you deploy your Brainliest application to production, mirroring your local development environment with:
- ✅ **Production Supabase** instance with all data
- ✅ **Vercel deployment** with serverless functions  
- ✅ **Environment variables** properly configured
- ✅ **Same data structure** as local development

## 🎯 **Prerequisites**

- ✅ Local development working on `http://127.0.0.1:5000`
- ✅ Supabase CLI installed and configured
- ✅ Vercel CLI installed (`npm install -g vercel`)
- ✅ GitHub repository with latest code

---

## 📶 **Step 1: Create Production Supabase Project**

### **1.1 Create New Project**
```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Choose organization and region
# Set database password (save this!)
# Project name: brainliest-production
```

### **1.2 Get Project Credentials**
```bash
# After project creation, go to Settings → API
# Copy these values:
# - Project URL: https://your-project-id.supabase.co
# - Service Role Key: service_role_key_here
# - Anon Public Key: anon_public_key_here
```

---

## 🗄️ **Step 2: Set Up Production Database**

### **2.1 Apply Migrations**
```bash
# Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations to production
supabase db push --include-all

# This will apply:
# - 20241225000001_initial_schema.sql
# - 20241225000002_add_missing_tables.sql
```

### **2.2 Apply Seed Data**
```bash
# Connect to production database
psql "postgresql://postgres:YOUR_DB_PASSWORD@db.your-project-id.supabase.co:5432/postgres"

# Run the seed file
\i supabase/seed-with-users-fixed.sql

# Verify data
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Subjects: ' || COUNT(*) FROM subjects;
SELECT 'Exams: ' || COUNT(*) FROM exams;
SELECT 'Questions: ' || COUNT(*) FROM questions;
```

### **2.3 Create Test Users (Optional)**
```bash
# Go to Supabase Dashboard → Authentication → Users
# Click "Add User" and create:

# Test User 1:
# Email: student@brainliest.test
# Password: TestPassword123!

# Test Admin:  
# Email: admin@brainliest.test
# Password: AdminPassword123!
```

---

## 🚀 **Step 3: Deploy to Vercel**

### **3.1 Prepare for Deployment**
```bash
# Make sure your code is committed
git add .
git commit -m "feat: Complete Supabase migration and auth system - production ready"
git push origin main
```

### **3.2 Deploy Application**
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: brainliest
# - Directory: ./
# - Override settings? No
```

---

## ⚙️ **Step 4: Configure Environment Variables**

### **4.1 Set Production Environment Variables**

In **Vercel Dashboard → Settings → Environment Variables**, add:

#### **🔗 Database & Supabase**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:your_db_password@db.your-project-id.supabase.co:5432/postgres
```

#### **🔐 JWT & Security**
```env
JWT_SECRET=your-production-jwt-secret-min-32-chars-long-random
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=your-production-admin-secret-min-32-chars-long
SESSION_SECRET=your-production-session-secret-min-32-chars-long
```

#### **👥 Admin Access**
```env
AUTHORIZED_ADMIN_EMAILS=admin@yourdomain.com,moderator@yourdomain.com
```

#### **🔧 Optional Services**
```env
GEMINI_API_KEY=your-gemini-api-key-for-ai-features
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

### **4.2 Generate Secure Secrets**
```bash
# Generate secure JWT secrets
openssl rand -base64 32   # For JWT_SECRET
openssl rand -base64 32   # For JWT_REFRESH_SECRET  
openssl rand -base64 32   # For ADMIN_JWT_SECRET
openssl rand -base64 32   # For SESSION_SECRET
```

---

## ✅ **Step 5: Verification & Testing**

### **5.1 Test Production Deployment**
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-14T...",
  "database": "connected",
  "version": "1.0.0"
}
```

### **5.2 Test Data Endpoints**
```bash
# Test categories
curl https://your-app.vercel.app/api/categories

# Test subjects  
curl https://your-app.vercel.app/api/subjects

# Should return the same data as local development
```

### **5.3 Test Authentication**
```bash
# Visit your production URL
# Try to access admin panel
# Should redirect to sign-in and work correctly
```

---

## 🎛️ **Step 6: Production Configuration**

### **6.1 Configure Custom Domain (Optional)**
```bash
# In Vercel Dashboard → Settings → Domains
# Add your custom domain
# Follow DNS configuration instructions
```

### **6.2 Configure Supabase Auth**
```bash
# In Supabase Dashboard → Authentication → Settings
# Set Site URL: https://your-app.vercel.app
# Add Redirect URLs:
# - https://your-app.vercel.app/auth/callback
# - https://your-app.vercel.app/admin
```

### **6.3 Production Security Settings**
```bash
# In Supabase Dashboard → Settings → API
# Ensure RLS is enabled on all tables
# Verify JWT settings match your environment variables
```

---

## 📊 **Step 7: Monitoring & Maintenance**

### **7.1 Set Up Monitoring**
```bash
# Vercel provides:
# - Function logs
# - Performance analytics
# - Error tracking

# Supabase provides:
# - Database metrics
# - API usage statistics  
# - Real-time monitoring
```

### **7.2 Backup Strategy**
```bash
# Supabase automatically backs up your database
# For additional backups:
supabase db dump --file=backup-$(date +%Y%m%d).sql

# Store backups securely
```

### **7.3 Updates & Maintenance**
```bash
# To deploy updates:
git push origin main
# Vercel will automatically redeploy

# To update database schema:
supabase db push
```

---

## 🔄 **Step 8: Data Migration (If Needed)**

### **8.1 Export from Local**
```bash
# Export local data (if you have additional data)
supabase db dump --data-only --file=local-data.sql
```

### **8.2 Import to Production**
```bash
# Import to production (be careful!)
psql "postgresql://postgres:password@db.project-id.supabase.co:5432/postgres" < local-data.sql
```

---

## 🎯 **Final Production URLs**

After successful deployment:

| Service | URL |
|---------|-----|
| **Production App** | `https://your-app.vercel.app` |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/your-project-id` |
| **Database Direct** | `https://your-project-id.supabase.co` |
| **API Health Check** | `https://your-app.vercel.app/api/health` |

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Environment Variables Not Working**
```bash
# Check Vercel dashboard
# Ensure all required variables are set
# Redeploy after adding variables
vercel --prod
```

#### **2. Database Connection Errors**
```bash
# Verify DATABASE_URL format
# Check Supabase project is active
# Ensure IP restrictions allow Vercel
```

#### **3. Authentication Issues**
```bash
# Check JWT secrets are set correctly
# Verify Supabase auth settings
# Ensure redirect URLs are configured
```

#### **4. Missing Data**
```bash
# Re-run seed data script
# Check migration status: supabase migration list
# Verify RLS policies allow access
```

---

## ✅ **Success Checklist**

- [ ] ✅ Production Supabase project created
- [ ] ✅ Database schema migrated successfully  
- [ ] ✅ Seed data applied (15 subjects, 21 exams, etc.)
- [ ] ✅ Vercel deployment successful
- [ ] ✅ Environment variables configured
- [ ] ✅ Health endpoint returns "healthy"
- [ ] ✅ Categories/subjects API working
- [ ] ✅ Authentication system functional
- [ ] ✅ Admin panel accessible
- [ ] ✅ Same functionality as local development

---

## 🎉 **You're Production Ready!**

Your Brainliest application is now:
- 🚀 **Deployed** to Vercel with serverless scaling
- 🗄️ **Connected** to production Supabase database  
- 🔐 **Secured** with proper authentication
- 📊 **Populated** with comprehensive test data
- 🔄 **Mirroring** your local development environment

**The client can now test the full functionality in production!**

---

## 📞 **Support**

If you encounter issues:
1. Check Vercel function logs
2. Monitor Supabase database metrics
3. Verify environment variables
4. Test API endpoints individually
5. Check authentication flow

**Your production deployment mirrors local development perfectly! 🎯** 