# 🚀 Local Build Instructions

## Quick Fix for Your Error

The error you're getting is because you need to build the project first on your local machine. Here's exactly what to do:

### Step 1: Build the project
```bash
# In your brainliest directory, run:
node scripts/build.js
```

This will create the `dist/index.js` file that's missing.

### Step 2: Run the production server
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
DATABASE_URL=postgresql://neondb_owner:npg_ROynF3Et2bYX@ep-super-rice-ado47v0n-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=dev-jwt-secret-min-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=dev-admin-secret-min-32-chars-long
SESSION_SECRET=dev-session-secret-min-32-chars
```

## Troubleshooting

If you still get errors:

1. **Clean build**: Delete `dist/` folder and rebuild
2. **Dependencies**: Run `npm install` to ensure all packages are installed
3. **Node version**: Ensure you're using Node.js 18+ with ES modules support

## Production Deployment

For Vercel deployment, the build process is handled automatically. The local build is only needed for local development and testing.