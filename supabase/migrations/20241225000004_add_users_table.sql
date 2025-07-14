-- Add Users Table Migration
-- Created: 2024-12-25
-- Purpose: Add missing users table for custom authentication system

-- Create user roles enum
DO $$ BEGIN
    CREATE TYPE user_roles AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table with all required fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    profile_image TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    ban_reason TEXT NOT NULL DEFAULT '',
    role user_roles NOT NULL DEFAULT 'user',
    
    -- Authentication fields
    password_hash TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Security fields
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Tracking fields
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip TEXT NOT NULL DEFAULT '',
    registration_ip TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update foreign key references in existing tables
ALTER TABLE exam_sessions 
    DROP CONSTRAINT IF EXISTS exam_sessions_user_id_fkey,
    ADD CONSTRAINT exam_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE uploads 
    DROP CONSTRAINT IF EXISTS uploads_uploaded_by_fkey,
    ADD CONSTRAINT uploads_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

-- Update auth_logs to reference users table
ALTER TABLE auth_logs 
    DROP CONSTRAINT IF EXISTS auth_logs_user_id_fkey,
    ADD CONSTRAINT auth_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update auth_sessions to reference users table
ALTER TABLE auth_sessions 
    DROP CONSTRAINT IF EXISTS auth_sessions_user_id_fkey,
    ADD CONSTRAINT auth_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 