-- Missing Database Tables for Brainliest Platform
-- Run this SQL to create all missing tables identified from error logs

-- 1. Create users table (main authentication table)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    role VARCHAR(50) DEFAULT 'user',
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    registration_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create auth_logs table (with correct column structure)
DROP TABLE IF EXISTS auth_logs;
CREATE TABLE auth_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create auth_sessions table (user session management)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Fix anon_question_sessions table (IP address storage issue)
DROP TABLE IF EXISTS anon_question_sessions;
CREATE TABLE anon_question_sessions (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    user_agent_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create admin_audit_logs table (admin action tracking)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    changes JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create user_profiles table (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create exam_analytics table (user performance tracking)
CREATE TABLE IF NOT EXISTS exam_analytics (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    exam_slug VARCHAR(100) NOT NULL,
    subject_slug VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_spent INTEGER, -- in seconds
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create detailed_answers table (detailed answer tracking)
CREATE TABLE IF NOT EXISTS detailed_answers (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    question_id UUID NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER, -- in seconds
    difficulty VARCHAR(20),
    subject_slug VARCHAR(100),
    exam_slug VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create user_exam_sessions table (exam session tracking)
CREATE TABLE IF NOT EXISTS user_exam_sessions (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    exam_slug VARCHAR(100) NOT NULL,
    subject_slug VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    is_completed BOOLEAN DEFAULT FALSE,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create freemium_sessions table (freemium user tracking)
CREATE TABLE IF NOT EXISTS freemium_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    user_agent_hash VARCHAR(64),
    questions_viewed INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs(email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_anon_question_sessions_ip ON anon_question_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_anon_question_sessions_last_reset ON anon_question_sessions(last_reset);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_user_name ON exam_analytics(user_name);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_exam_slug ON exam_analytics(exam_slug);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_completed_at ON exam_analytics(completed_at);
CREATE INDEX IF NOT EXISTS idx_detailed_answers_user_name ON detailed_answers(user_name);
CREATE INDEX IF NOT EXISTS idx_detailed_answers_question_id ON detailed_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_sessions_user_name ON user_exam_sessions(user_name);
CREATE INDEX IF NOT EXISTS idx_user_exam_sessions_exam_slug ON user_exam_sessions(exam_slug);
CREATE INDEX IF NOT EXISTS idx_freemium_sessions_session_id ON freemium_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_freemium_sessions_ip_address ON freemium_sessions(ip_address);

-- Insert a default admin user for testing
INSERT INTO users (email, username, first_name, last_name, role, password_hash, email_verified, created_at, updated_at)
VALUES 
    ('admin@brainliest.com', 'admin', 'System', 'Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyPuKsgGNVK3wbBJqKL0x.', TRUE, NOW(), NOW()),
    ('tapha@live.co.uk', 'tapha', 'Tapha', 'User', 'user', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyPuKsgGNVK3wbBJqKL0x.', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'users', 
    'auth_logs', 
    'auth_sessions', 
    'anon_question_sessions', 
    'admin_audit_logs',
    'user_profiles',
    'exam_analytics',
    'detailed_answers',
    'user_exam_sessions',
    'freemium_sessions'
)
ORDER BY tablename; 