# Vercel Storage Migration Guide

## Option 1: Vercel Postgres (RECOMMENDED)

### Why This Is Perfect for Your App:
- **Zero Code Changes**: Uses same PostgreSQL dialect as Neon
- **Native Vercel Integration**: Optimized for serverless functions
- **Connection Pooling**: Built-in connection management
- **Same Schema Support**: Full compatibility with your Drizzle setup

### Migration Steps:

1. **Add Vercel Postgres to Project**
   ```bash
   # In Vercel Dashboard
   Project → Storage → Add Integration → Vercel Postgres
   ```

2. **Get Database Credentials**
   ```bash
   # Vercel will provide these environment variables:
   POSTGRES_URL=
   POSTGRES_PRISMA_URL=
   POSTGRES_URL_NON_POOLING=
   ```

3. **Update Environment Variables**
   ```bash
   # In Vercel Project Settings → Environment Variables
   DATABASE_URL = [Your POSTGRES_URL from step 2]
   ```

4. **Run Migration**
   ```bash
   # Deploy to apply schema
   npm run db:push
   ```

### Benefits:
- ✅ **Instant Setup**: 2-minute integration
- ✅ **No Code Changes**: Works with existing Drizzle schema
- ✅ **Serverless Optimized**: Perfect for Vercel Functions
- ✅ **Connection Pooling**: Handles concurrent requests

---

## Option 2: Supabase (Alternative)

### Why Good Alternative:
- **Real PostgreSQL**: Not modified, full compatibility
- **Better Pricing**: More generous free tier
- **Additional Features**: Built-in Auth, Real-time, Storage
- **Global CDN**: Edge locations worldwide

### Migration Steps:

1. **Create Supabase Project**
   ```bash
   # Go to supabase.com
   # Create new project
   # Choose region closest to your users
   ```

2. **Get Connection String**
   ```bash
   # In Supabase Dashboard → Settings → Database
   CONNECTION_STRING = postgresql://postgres:[password]@[host]:5432/postgres
   ```

3. **Update Environment Variables**
   ```bash
   # In Vercel Project Settings
   DATABASE_URL = [Your Supabase connection string]
   ```

4. **Run Migration**
   ```bash
   npm run db:push
   ```

### Benefits:
- ✅ **Real PostgreSQL**: Full feature compatibility
- ✅ **Generous Free Tier**: 500MB database, 5GB bandwidth
- ✅ **Global Performance**: Edge CDN
- ✅ **Bonus Features**: Auth, Real-time, File Storage

---

## Migration Checklist

### Pre-Migration:
- [ ] Backup current Neon database (if has data)
- [ ] Test new database connection locally
- [ ] Verify all environment variables

### During Migration:
- [ ] Update DATABASE_URL in Vercel
- [ ] Run `npm run db:push` to create schema
- [ ] Test critical endpoints
- [ ] Verify admin panel functionality

### Post-Migration:
- [ ] Run seed script (if needed)
- [ ] Test user registration/login
- [ ] Verify exam taking flow
- [ ] Check analytics functionality

---

## Environment Variables Needed

```bash
# Database (PRIMARY - choose one)
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-strong-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ADMIN_JWT_SECRET=your-admin-secret
SESSION_SECRET=your-session-secret

# Email (Titan Mail)
SMTP_HOST=smtp.titan.email
SMTP_PORT=587
SMTP_USER=noreply@brainliest.com
SMTP_PASS=your-titan-email-password

# Google Services
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret

# Admin
AUTHORIZED_ADMIN_EMAILS=admin@brainliest.com,support@brainliest.com
```

---

## Expected Results

### ✅ After Migration You'll Have:
- Working database connection on Vercel
- All existing features functional
- Better performance (connection pooling)
- Scalable architecture
- Same codebase, different database provider

### 🎯 Zero Code Changes Required:
Your app will work exactly the same because:
- Same PostgreSQL dialect
- Same Drizzle ORM
- Same schema structure
- Same query patterns
- Same environment variable name (DATABASE_URL)

---

## Recommended Choice: **Vercel Postgres**

**Reason**: Native integration, zero configuration, optimized for your deployment platform.

Time to complete: **~10 minutes**