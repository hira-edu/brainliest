# 🚀 Local Build Instructions

## Quick Fix for Your Error

The error you're getting is because you need to build the project first on your local machine. Here's exactly what to do:

### Step 1: Navigate to your project directory
```bash
cd /Users/umairliaquat/Documents/GitHub/brainliest
```

### Step 2: Build the project
```bash
# This will create the missing dist/index.js file
node scripts/build.js
```

### Step 3: Verify the build worked
```bash
# Optional: Check if everything is set up correctly
node scripts/verify-build.js
```

### Step 4: Run the production server
```bash
npm start
```

## Alternative Build Methods

If the custom build script doesn't work, you can manually build just the backend:

```bash
# Build only the backend server
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

Then run:
```bash
npm start
```

## What the Build Process Does

1. **Backend Build**: Compiles TypeScript server code into `dist/index.js`
2. **Static Assets**: Copies essential frontend files to `dist/public/`
3. **Database Connection**: Ensures proper Neon PostgreSQL connectivity

## Environment Setup

Make sure your `.env` file contains:
```
DATABASE_URL=postgresql://neondb_owner:npg_ROynF3Et2bYX@ep-super-rice-ado47v0n-pooler.c-2.us-east-1.aws.supabase.com/neondb?sslmode=require
JWT_SECRET=dev-jwt-secret-min-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=dev-admin-secret-min-32-chars-long
SESSION_SECRET=dev-session-secret-min-32-chars
```

## Troubleshooting

If you still get errors:

1. **Clean build**: Delete `dist/` folder and rebuild
   ```bash
   rm -rf dist/
   node scripts/build.js
   ```

2. **Dependencies**: Run `npm install` to ensure all packages are installed
   ```bash
   npm install
   ```

3. **Node version**: Ensure you're using Node.js 18+ with ES modules support
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

4. **Permissions**: Make sure scripts are executable
   ```bash
   chmod +x scripts/build.js scripts/verify-build.js
   ```

5. **Path issues**: Make sure you're in the right directory
   ```bash
   pwd  # Should show your brainliest project directory
   ls   # Should show package.json, server/, client/, etc.
   ```

## Production Deployment

For Vercel deployment, the build process is handled automatically. The local build is only needed for local development and testing.