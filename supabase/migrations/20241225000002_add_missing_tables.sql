-- Add Missing Tables Migration
-- Created: 2024-12-25
-- Purpose: Add missing tables for session management and authentication

-- Anonymous question sessions for freemium limits
CREATE TABLE IF NOT EXISTS anon_question_sessions (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth logs for security tracking
CREATE TABLE IF NOT EXISTS auth_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'login', 'logout', 'failed_login', etc.
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth sessions for JWT management
CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics and progress tracking
CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_slug TEXT NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, exam_slug)
);

-- Question feedback and comments
CREATE TABLE IF NOT EXISTS question_comments (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_anon_sessions_ip ON anon_question_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_reset ON anon_question_sessions(last_reset);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_exam ON user_analytics(exam_slug);
CREATE INDEX IF NOT EXISTS idx_question_comments_question ON question_comments(question_id);

-- Add triggers for updated_at
CREATE TRIGGER update_anon_question_sessions_updated_at 
    BEFORE UPDATE ON anon_question_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at 
    BEFORE UPDATE ON auth_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at 
    BEFORE UPDATE ON user_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_comments_updated_at 
    BEFORE UPDATE ON question_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE anon_question_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous sessions (public read/write with restrictions)
CREATE POLICY "Public can manage their own sessions" ON anon_question_sessions
    FOR ALL USING (true);

-- RLS Policies for auth logs (admin only)
CREATE POLICY "Admin can view all auth logs" ON auth_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for auth sessions (users can manage their own)
CREATE POLICY "Users can manage their own sessions" ON auth_sessions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user analytics (users can view their own)
CREATE POLICY "Users can view their own analytics" ON user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON user_analytics
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'system'));

-- RLS Policies for question comments (public read, authenticated write)
CREATE POLICY "Anyone can view approved comments" ON question_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can add comments" ON question_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage all comments" ON question_comments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin'); 