# Supabase Local Development Setup

## Issue: Storage System Permission Errors

When running `supabase db pull`, you may encounter this error:
```
ERROR: must be owner of relation prefixes (SQLSTATE 42501)
At statement: 4
drop trigger if exists "prefixes_create_hierarchy" on "storage"."prefixes"
```

## Root Cause

Supabase's storage system tables (`storage.prefixes`, `storage.objects`, etc.) require superuser permissions to modify. These tables are managed automatically by Supabase and should not be modified in local development.

## Solutions

### Option 1: Use Existing Migration Package (Recommended)

Instead of `supabase db pull`, use our pre-built migration package:

```bash
# Use our complete database export
psql -h localhost -p 54322 -U postgres -d postgres -f migrations/supabase-export.sql

# Apply RLS policies
psql -h localhost -p 54322 -U postgres -d postgres -f migrations/supabase-rls-policies.sql
```

### Option 2: Manual Schema Recreation

If you need to recreate the schema manually:

```bash
# 1. Reset your local database
supabase db reset

# 2. Apply our core migrations in order
supabase migration up

# 3. Seed with sample data
npm run db:seed
```

### Option 3: Skip Storage System Tables

If you must use `supabase db pull`, create a custom config:

```bash
# Pull only specific schemas (skip storage system)
supabase db pull --schema public --schema auth

# Or use --exclude-schema to skip storage
supabase db pull --exclude-schema storage
```

## Best Practices

1. **Use Remote Database**: Keep using the remote Supabase database for development since it's already configured correctly
2. **Local Testing Only**: Only use local database for isolated testing of migrations
3. **Production Parity**: The remote Supabase database is production-ready with proper security
4. **Migration Strategy**: Create new migrations for schema changes, don't pull existing schema

## Current Database Status

- **Remote Supabase**: ✅ Fully configured with RLS, functions, and sample data
- **Local Development**: Use remote database (recommended)
- **Migration Package**: Available in `migrations/supabase-export.sql`

## Troubleshooting

If you encounter storage permission errors:

1. Skip the problematic migration
2. Use our pre-built migration package
3. Continue using the remote database for development
4. Only use local database for testing specific migrations

The application is designed to work with the remote Supabase database, which has all security and performance configurations properly applied.