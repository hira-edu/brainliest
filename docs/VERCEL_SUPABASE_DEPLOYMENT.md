# Vercel + Supabase Deployment Guide

Complete guide for deploying the Brainliest certification platform to Vercel with Supabase PostgreSQL database.

## Prerequisites

### 1. Supabase Project Setup
- Create a new project at [supabase.com](https://supabase.com)
- Get your database connection string from Project Settings → Database
- Note your Project URL and API keys

### 2. Vercel Account
- Sign up at [vercel.com](https://vercel.com)
- Install Vercel CLI: `npm i -g vercel`
- Connect your GitHub repository

## Environment Variables

Set these in both local `.env` and Vercel project settings:

```env
# Database (Required)
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:[password]@[host]:[port]/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[password]@[host]:[port]/postgres?pgbouncer=true&connect_timeout=15

# Supabase (Optional for advanced features)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
ADMIN_JWT_SECRET=your-super-secret-admin-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Email (Optional)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# reCAPTCHA (Optional)
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini AI (Optional)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## Quick Deployment

### 1. Prepare Database
```bash
# Test connection
npm run db:test

# Seed with comprehensive exam data
npm run seed:production
```

### 2. Deploy to Vercel
```bash
# Automated deployment
chmod +x scripts/deploy-to-vercel.sh
./scripts/deploy-to-vercel.sh
```

Or manually:
```bash
# Build and deploy
npm run build
vercel --prod
```

## Database Schema

The seeding script creates a comprehensive certification platform:

### Categories (6)
- Project Management
- Cloud Computing  
- Cybersecurity
- IT Infrastructure
- Data Analytics
- Business Analysis

### Subjects (19)
- **Project Management**: PMP, CAPM, CSM, PSM
- **Cloud Computing**: AWS (3), Azure (2), GCP (1)
- **Cybersecurity**: Security+, CISSP, CISA
- **Infrastructure**: Network+, CCNA
- **Data/Business**: Google Analytics, Tableau, CBAP, Six Sigma

### Practice Exams (10)
- PMP comprehensive simulations
- AWS Cloud Practitioner & Solutions Architect
- Azure Fundamentals
- CompTIA Security+
- And more certification paths

### Questions (50+)
- Realistic certification scenarios
- Detailed explanations
- Multiple difficulty levels
- Domain-specific coverage

## Vercel Configuration

The project includes optimized `vercel.json`:

```json
{
  "buildCommand": "node scripts/vercel-build.js",
  "outputDirectory": "dist",
  "framework": null,
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Production Features

### Database Features
- Row Level Security (RLS) enabled
- Optimized indexes for performance
- Comprehensive exam data
- Real-time trending analytics

### Application Features
- Server-side rendering compatibility
- Optimized bundle splitting
- Progressive Web App capabilities
- SEO optimization

### Security Features
- JWT-based authentication
- Admin role management
- Rate limiting
- Input validation
- CORS protection

## Monitoring & Analytics

### Built-in Analytics
- Exam completion rates
- Question difficulty analysis
- User progress tracking
- Trending certification data

### Performance Monitoring
- Database query optimization
- API response times
- Error tracking
- User experience metrics

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Test connection
   node scripts/test-database-connection.js
   ```

2. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules/.cache
   npm run build
   ```

3. **Environment Variables**
   ```bash
   # Verify in Vercel dashboard
   vercel env ls
   ```

### Database Debugging
```sql
-- Check data seeding
SELECT 
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM subjects) as subjects,
  (SELECT COUNT(*) FROM exams) as exams,
  (SELECT COUNT(*) FROM questions) as questions;
```

## Performance Optimization

### Database
- Connection pooling enabled
- Optimized query patterns
- Proper indexing strategy

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### API
- Response caching
- Gzip compression
- Rate limiting
- Error handling

## Support

For deployment issues:

1. Check [Vercel docs](https://vercel.com/docs)
2. Review [Supabase guides](https://supabase.com/docs)
3. Test locally first: `npm run dev`
4. Check browser console for errors
5. Review server logs in Vercel dashboard

## Next Steps

After successful deployment:

1. **Content Management**: Use admin panel to add more exams
2. **User Analytics**: Monitor certification trends
3. **SEO Optimization**: Submit sitemap to search engines
4. **Performance**: Set up monitoring alerts
5. **Scaling**: Review database performance metrics

Your certification preparation platform is now live and ready to help users prepare for their professional certifications!