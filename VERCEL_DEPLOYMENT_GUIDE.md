# Vercel Deployment Guide for Brainliest

## Quick Setup

Your application is already configured for Vercel deployment. Follow these simple steps:

### 1. Create Neon Database (if you haven't already)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/main`)

### 2. Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project" → "Import Git Repository"
4. Select your repository and click "Deploy"

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel
```

### 3. Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```bash
# Required: Database connection
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/main?sslmode=require

# Required: Security secrets (generate random 32+ character strings)
SESSION_SECRET=your_super_secret_session_key_must_be_32_chars_minimum
JWT_SECRET=your_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_chars_minimum
ADMIN_JWT_SECRET=your_admin_jwt_secret_32_chars_minimum

# Optional: AI features
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Email service (for authentication)
RESEND_API_KEY=your_resend_api_key_here

# Optional: Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
```

3. Make sure each variable is enabled for **Production**, **Preview**, and **Development**

### 4. Initialize Database

After deployment, run database migrations:

```bash
# If using Vercel CLI locally
vercel env pull .env.local
npm run db:push

# Or run this in your Neon SQL Editor:
# Your database tables will be automatically created on first app load
```

### 5. Verify Deployment

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Check database connectivity: `https://your-app.vercel.app/api/health`
3. Test admin access: `https://your-app.vercel.app/admin`

## Your Application Features

✅ **47+ Subject Categories** - PMP, AWS, CompTIA, Mathematics, Statistics, etc.
✅ **Complete Authentication** - Email/password and Google OAuth
✅ **Admin Panel** - Content management with CSV import/export
✅ **Analytics Dashboard** - Performance tracking and insights
✅ **IP-based Freemium** - 20 questions for anonymous users
✅ **Mobile Responsive** - Works on all devices
✅ **SEO Optimized** - Sitemap, meta tags, structured data

## Admin Access

- **Admin Email**: `admin@brainliest.com`
- **Admin Password**: `Super.Admin.123!@#`
- **Admin URL**: `https://your-app.vercel.app/admin`

## Troubleshooting

### Database Connection Issues
If you see database errors:

1. Check your `DATABASE_URL` includes `?sslmode=require`
2. Verify the connection string is correct in Vercel environment variables
3. Check the health endpoint: `/api/health`

### Build Errors
Your project uses optimized settings:
- Node.js 18.x runtime
- Conservative connection pooling for Neon
- Serverless-optimized configurations

### Common Solutions
```bash
# Test locally with Vercel environment
vercel env pull .env.local
npm run dev

# Check logs
vercel logs your-deployment-url

# Redeploy
vercel --prod
```

## Production Optimizations Already Applied

✅ **Database Connection Pool**: Optimized for Neon (max: 3 connections)
✅ **Serverless Configuration**: Cold start optimized
✅ **Error Handling**: Comprehensive logging and monitoring
✅ **SSL Configuration**: Required for production databases
✅ **Health Monitoring**: Real-time status checks
✅ **Vercel Configuration**: Fixed runtime issues for modern Vercel deployment
✅ **Auto-detection**: Simplified vercel.json using Vercel's built-in Node.js detection

## Recent Fix Applied
- **Fixed Vercel Runtime Error**: Removed outdated function runtime configuration
- **Modern Deployment**: Now uses Vercel's automatic Node.js detection
- **Ready to Deploy**: No more "Function Runtimes must have a valid version" errors

Your application is production-ready and optimized for Vercel + Neon deployment!