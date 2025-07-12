# Supabase Remote Database Setup Guide

This guide explains how to set up and configure the remote Supabase database for the Brainliest project.

## Prerequisites

- Supabase account (https://supabase.com)
- Project created in Supabase dashboard
- Database password set during project creation

## Environment Configuration

### 1. Database Connection

Add the following to your `.env` file:

```env
# Supabase Remote Configuration (Production)
SUPABASE_URL=https://bnjpjfwdcydjraagdlxb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_URL=https://bnjpjfwdcydjraagdlxb.supabase.co

# Database Connection Strings
DATABASE_URL=postgres://postgres.bnjpjfwdcydjraagdlxb:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_URL_NON_POOLING=postgres://postgres.bnjpjfwdcydjraagdlxb:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_PRISMA_URL=postgres://postgres.bnjpjfwdcydjraagdlxb:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# Database Connection Details
POSTGRES_USER=postgres
POSTGRES_HOST=db.bnjpjfwdcydjraagdlxb.supabase.co
POSTGRES_PASSWORD=your_database_password
POSTGRES_DATABASE=postgres

# JWT Configuration
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### 2. Replace Placeholders

Replace the following placeholders in your connection string:
- `{project_id}`: Your Supabase project ID (e.g., `bnjpjfwdcydjraagdlxb`)
- `{password}`: Your database password

## Database Migration

### 1. Using Drizzle Kit

```bash
# Push schema to remote database
npm run db:push

# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 2. Using SQL Migration Files

Apply the migration files in order:
1. `migrations/supabase-export.sql` - Full schema and data
2. `migrations/supabase-rls-policies.sql` - Row Level Security policies
3. `migrations/20250712122500_skip_storage_system.sql` - Skip storage system

## Security Configuration

### 1. Row Level Security (RLS)

RLS is enabled on all tables with the following policies:

**Public Read Access:**
- `subjects` - Course subjects
- `categories` - Subject categories  
- `subcategories` - Subject subcategories
- `exams` - Practice exams
- `questions` - Exam questions

**Protected Tables:**
- `users` - User accounts
- `user_sessions` - User sessions
- `auth_logs` - Authentication logs
- `audit_logs` - System audit logs

**Anonymous Access:**
- `freemium_sessions` - Guest user sessions

### 2. Function Security

All database functions use `SECURITY DEFINER` with explicit `search_path`:

```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- function body
END;
$$;
```

## Configuration Files

### 1. Drizzle Configuration (`config/drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'supabase'
  }
});
```

### 2. Remote Database Configuration (`config/remote-database.toml`)

Contains comprehensive settings for:
- Database connection parameters
- Authentication configuration
- Migration settings
- Security policies
- Performance optimization
- Monitoring and backup

## Testing Connection

### 1. Test Database Connection

```bash
# Test connection and basic queries
node scripts/test-database-connection.js
```

### 2. Verify API Endpoints

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Check subjects endpoint  
curl https://your-app.vercel.app/api/subjects

# Check trending endpoint
curl https://your-app.vercel.app/api/trending/certifications
```

## Production Deployment

### 1. Environment Variables

Set the following environment variables in your deployment platform:

**Required:**
- `DATABASE_URL` - Supabase connection string
- `SUPABASE_JWT_SECRET` - JWT secret for token verification
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

**Optional:**
- `NODE_ENV=production`
- `JWT_SECRET` - Application JWT secret
- `ADMIN_JWT_SECRET` - Admin JWT secret
- `SESSION_SECRET` - Session secret

### 2. Vercel Deployment

The project is configured for Vercel deployment with:
- Build command: `node scripts/vercel-build.js`
- Output directory: `dist/public`
- API routes configured for serverless functions

## Monitoring and Maintenance

### 1. Database Monitoring

- Query performance through Supabase dashboard
- Connection pool monitoring
- Slow query identification
- Resource usage tracking

### 2. Backup Strategy

- Automatic daily backups (30-day retention)
- Point-in-time recovery available
- Manual backup before major migrations

### 3. Security Monitoring

- RLS policy effectiveness
- Authentication log analysis
- Suspicious activity detection
- Regular security audits

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if database is active (not paused)
   - Verify connection string format
   - Ensure SSL mode is required

2. **Authentication Errors**
   - Verify JWT secret matches
   - Check service role key permissions
   - Validate token expiration

3. **Permission Denied**
   - Review RLS policies
   - Check user roles and permissions
   - Verify function security settings

4. **Performance Issues**
   - Check connection pool size
   - Review query execution plans
   - Optimize indexes

### Support Resources

- Supabase Documentation: https://supabase.com/docs
- Drizzle ORM Documentation: https://orm.drizzle.team
- PostgreSQL Documentation: https://www.postgresql.org/docs