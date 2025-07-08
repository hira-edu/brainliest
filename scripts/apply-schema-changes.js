#!/usr/bin/env node
/**
 * Schema migration script to apply the new enhanced schema changes:
 * - Add user_roles enum
 * - Convert metadata from TEXT to JSONB
 * - Add composite indexes
 * - Update table constraints
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Client } from '@neondatabase/serverless';

const client = new Client(process.env.DATABASE_URL);
const db = drizzle(client);

async function applySchemaChanges() {
  console.log('🔄 Starting schema migration...');
  
  try {
    // Step 1: Create user_roles enum if it doesn't exist
    console.log('📝 Creating user_roles enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_roles AS ENUM ('user', 'admin', 'moderator');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Step 2: Add role column with enum type if it doesn't exist
    console.log('📝 Adding role column to users table...');
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN role user_roles DEFAULT 'user';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    
    // Step 3: Convert metadata column from TEXT to JSONB
    console.log('📝 Converting metadata column to JSONB...');
    await client.query(`
      DO $$ BEGIN
        -- Add temporary JSONB column
        ALTER TABLE users ADD COLUMN metadata_new JSONB DEFAULT '{}';
        
        -- Convert existing text data to JSONB (if any data exists)
        UPDATE users SET metadata_new = 
          CASE 
            WHEN metadata IS NULL OR metadata = '' THEN '{}'::jsonb
            ELSE metadata::jsonb
          END
        WHERE metadata IS NOT NULL;
        
        -- Drop old column and rename new one
        ALTER TABLE users DROP COLUMN IF EXISTS metadata;
        ALTER TABLE users RENAME COLUMN metadata_new TO metadata;
        
        -- Set NOT NULL constraint
        ALTER TABLE users ALTER COLUMN metadata SET NOT NULL;
      EXCEPTION
        WHEN others THEN 
          RAISE NOTICE 'Metadata column conversion failed or already applied: %', SQLERRM;
      END $$;
    `);
    
    // Step 4: Create composite index for anon_question_sessions
    console.log('📝 Creating composite index for freemium sessions...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS anon_sessions_ip_ua_idx 
      ON anon_question_sessions (ip_address, user_agent_hash);
    `);
    
    // Step 5: Create index on users.role
    console.log('📝 Creating index on users role column...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS users_by_role_idx 
      ON users (role);
    `);
    
    // Step 6: Add default values for non-nullable text fields
    console.log('📝 Adding default values for text fields...');
    await client.query(`
      DO $$ BEGIN
        -- Ensure firstName has default
        ALTER TABLE users ALTER COLUMN first_name SET DEFAULT '';
        UPDATE users SET first_name = '' WHERE first_name IS NULL;
        ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
        
        -- Ensure lastName has default  
        ALTER TABLE users ALTER COLUMN last_name SET DEFAULT '';
        UPDATE users SET last_name = '' WHERE last_name IS NULL;
        ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
        
        -- Ensure other text fields have defaults
        ALTER TABLE users ALTER COLUMN profile_image SET DEFAULT '';
        ALTER TABLE users ALTER COLUMN ban_reason SET DEFAULT '';
        ALTER TABLE users ALTER COLUMN last_login_ip SET DEFAULT '';
        ALTER TABLE users ALTER COLUMN registration_ip SET DEFAULT '';
        
        UPDATE users SET profile_image = '' WHERE profile_image IS NULL;
        UPDATE users SET ban_reason = '' WHERE ban_reason IS NULL;
        UPDATE users SET last_login_ip = '' WHERE last_login_ip IS NULL;
        UPDATE users SET registration_ip = '' WHERE registration_ip IS NULL;
        
        ALTER TABLE users ALTER COLUMN profile_image SET NOT NULL;
        ALTER TABLE users ALTER COLUMN ban_reason SET NOT NULL;
        ALTER TABLE users ALTER COLUMN last_login_ip SET NOT NULL;
        ALTER TABLE users ALTER COLUMN registration_ip SET NOT NULL;
      EXCEPTION
        WHEN others THEN 
          RAISE NOTICE 'Default values setup failed or already applied: %', SQLERRM;
      END $$;
    `);
    
    // Step 7: Update existing users to have proper defaults
    console.log('📝 Setting default values for existing users...');
    await client.query(`
      UPDATE users SET 
        role = 'user' WHERE role IS NULL,
        metadata = '{}' WHERE metadata IS NULL,
        first_name = '' WHERE first_name IS NULL,
        last_name = '' WHERE last_name IS NULL,
        profile_image = '' WHERE profile_image IS NULL,
        ban_reason = '' WHERE ban_reason IS NULL,
        last_login_ip = '' WHERE last_login_ip IS NULL,
        registration_ip = '' WHERE registration_ip IS NULL;
    `);
    
    console.log('✅ Schema migration completed successfully!');
    console.log('');
    console.log('Changes applied:');
    console.log('- ✅ Created user_roles enum (user, admin, moderator)');
    console.log('- ✅ Added role column with enum type');
    console.log('- ✅ Converted metadata from TEXT to JSONB');
    console.log('- ✅ Added composite index on (ip_address, user_agent_hash)');
    console.log('- ✅ Added index on users.role');
    console.log('- ✅ Set proper defaults for text fields');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  applySchemaChanges()
    .then(() => {
      console.log('🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { applySchemaChanges };