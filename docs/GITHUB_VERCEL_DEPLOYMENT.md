# GitHub + Vercel Deployment Guide for Brainliest

## Quick Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit your project
git commit -m "Initial commit: Brainliest exam platform"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/brainliest.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in with GitHub**

2. **Click "New Project" and import your GitHub repository**

3. **Configure Environment Variables in Vercel:**
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_32_character_random_string
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=production
   ```

4. **Use these Build Settings:**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

5. **Deploy!** Vercel will automatically build and deploy your app.

## Database Setup for Production

### Option 1: Supabase Database (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a free PostgreSQL database
2. Copy the connection string to your Vercel environment variables
3. Run database migration: `npm run db:push` (run locally first, then Vercel will auto-migrate)

### Option 2: Railway Database
1. Go to [railway.app](https://railway.app) and create a PostgreSQL database
2. Copy connection string to Vercel environment variables

### Option 3: Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a PostgreSQL database
2. Use the connection string in your Vercel environment variables

## Important Files for Vercel

The project includes:
- `vercel.json` - Vercel configuration for routing and builds
- `.env.example` - Template for environment variables
- Health check endpoint at `/api/health` for monitoring

## Build Process

Vercel will automatically:
1. Install dependencies with `npm install`
2. Build the frontend with `vite build`
3. Build the backend with `esbuild`
4. Deploy both as a full-stack application

## Environment Variables Required

### Essential (Required)
```
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=minimum_32_character_random_string_for_security
```

### Optional (Recommended)
```
GOOGLE_GEMINI_API_KEY=your_api_key_for_ai_features
NODE_ENV=production
```

## Domain Configuration

After deployment:
1. Vercel will provide a `.vercel.app` domain
2. You can add a custom domain in Vercel settings
3. SSL certificates are automatically provided

## Monitoring and Logs

- **Health Check**: `https://yourapp.vercel.app/api/health`
- **Vercel Logs**: Available in Vercel dashboard
- **Database Monitoring**: Available in your database provider dashboard

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check all environment variables are set
   - Ensure DATABASE_URL is accessible from Vercel

2. **Database Connection Errors**
   - Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
   - Ensure database allows external connections

3. **AI Features Not Working**
   - Add GOOGLE_GEMINI_API_KEY to environment variables
   - Verify API key is valid and has proper permissions

## Production Features

Your deployed app includes:
- **47 academic and professional subjects**
- **PostgreSQL database** with persistent storage
- **AI-powered question assistance** using Google Gemini
- **Comprehensive admin panel** with user management
- **Advanced analytics** and progress tracking
- **Responsive design** for all devices

## Scaling

Vercel automatically handles:
- Global CDN for fast loading
- Automatic scaling based on traffic
- SSL certificates and security headers
- Edge function optimization

Your Brainliest platform is production-ready and will scale automatically with your user base!

## Support

For deployment issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connectivity
4. Check `/api/health` endpoint status

Your app will be live at: `https://yourapp.vercel.app`