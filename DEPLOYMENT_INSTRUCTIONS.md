# Deploy Your Brainliest Platform to GitHub & Vercel

## Step 1: Download Your Project Files

1. **Download all project files** from your Replit workspace
2. **Extract** to a folder on your computer (e.g., `brainliest-platform`)

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click **"New Repository"**
3. Name it: `brainliest-platform` (or your preferred name)
4. Keep it **Public** (recommended) or Private
5. **Don't** initialize with README, .gitignore, or license
6. Click **"Create Repository"**

## Step 3: Upload Your Code to GitHub

Open terminal/command prompt in your project folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: Brainliest exam platform"

# Add your GitHub repository (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Set Up Database (Required)

### Option 1: Neon Database (Free & Easy)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project: "Brainliest Platform"
4. Copy the **connection string** (starts with `postgresql://`)

### Option 2: Supabase (Alternative)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the **connection string**

## Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with **GitHub**
3. Click **"New Project"**
4. **Import** your GitHub repository
5. Configure these settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

## Step 6: Add Environment Variables

In Vercel, go to **Settings → Environment Variables** and add:

### Required (Minimum to run)
```
DATABASE_URL = your_postgresql_connection_string_from_step_4
NODE_ENV = production
```

### Optional (For full features)
```
GEMINI_API_KEY = your_google_gemini_api_key
VITE_GOOGLE_CLIENT_ID = your_google_oauth_client_id
GOOGLE_CLIENT_SECRET = your_google_oauth_secret
RESEND_API_KEY = your_resend_email_api_key
```

## Step 7: Deploy!

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (2-3 minutes)
3. Visit your live URL: `https://your-project.vercel.app`

## Your Platform Features

✅ **47+ exam subjects** (PMP, AWS, CompTIA, academics)  
✅ **Question interface** with immediate feedback  
✅ **Admin panel** at `/admin`  
✅ **User authentication** (email + Google)  
✅ **Analytics dashboard** at `/analytics`  
✅ **CSV import/export** for bulk question management  
✅ **Mobile responsive** design  
✅ **AI-powered** question assistance  
✅ **Cookie management** for GDPR compliance  

## Admin Access

Visit `your-domain.vercel.app/admin` to access the admin panel and start adding your content.

## Need Help?

- Check Vercel deployment logs if build fails
- Ensure DATABASE_URL is correctly set
- Test your database connection
- All features work without optional API keys (they just enhance functionality)

## Success! 🎉

Your exam preparation platform is now live on the internet. Share the URL with your users and start building your question database through the admin panel.

**Deployment Complete:** Your Brainliest platform is ready for production use!