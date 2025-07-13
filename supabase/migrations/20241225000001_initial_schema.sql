-- Initial Schema Migration for Supabase
-- Created: 2024-12-25
-- Purpose: Complete database schema with RLS policies and optimizations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===============================
-- CORE CONTENT TABLES
-- ===============================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    slug TEXT PRIMARY KEY,
    category_slug TEXT NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    category_slug TEXT REFERENCES categories(slug) ON DELETE SET NULL,
    subcategory_slug TEXT REFERENCES subcategories(slug) ON DELETE SET NULL,
    exam_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    slug TEXT PRIMARY KEY,
    subject_slug TEXT NOT NULL REFERENCES subjects(slug) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    question_count INTEGER NOT NULL,
    duration INTEGER, -- in minutes
    difficulty difficulty NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_slug TEXT NOT NULL REFERENCES exams(slug) ON DELETE CASCADE,
    subject_slug TEXT NOT NULL REFERENCES subjects(slug) ON DELETE CASCADE,
    text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer INTEGER NOT NULL,
    correct_answers INTEGER[],
    allow_multiple_answers BOOLEAN DEFAULT false,
    explanation TEXT,
    domain TEXT,
    difficulty difficulty NOT NULL,
    "order" INTEGER DEFAULT 0,
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- USER MANAGEMENT TABLES
-- ===============================

-- Enhanced users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_slug TEXT NOT NULL REFERENCES exams(slug) ON DELETE CASCADE,
    subject_slug TEXT NOT NULL REFERENCES subjects(slug) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_question_index INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    score NUMERIC(5,2),
    time_spent INTEGER, -- in seconds
    is_completed BOOLEAN DEFAULT false,
    is_passed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- PERFORMANCE INDEXES
-- ===============================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order, name);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active) WHERE is_active = true;

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category_slug);
CREATE INDEX IF NOT EXISTS idx_subjects_subcategory ON subjects(subcategory_slug);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subjects_counts ON subjects(exam_count, question_count);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_slug);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_slug);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_search ON questions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(exam_slug, "order");

-- Exam sessions indexes
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_slug);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_completed ON exam_sessions(completed_at) WHERE completed_at IS NOT NULL;

-- ===============================
-- ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for subcategories" ON subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for subjects" ON subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for exams" ON exams FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for questions" ON questions FOR SELECT USING (true);

-- Admin write access for content tables
CREATE POLICY "Admin write access for categories" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admin write access for subcategories" ON subcategories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admin write access for subjects" ON subjects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admin write access for exams" ON exams FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admin write access for questions" ON questions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

-- User profile policies
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'super_admin')
    )
);

-- Exam session policies
CREATE POLICY "Users can access own sessions" ON exam_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can access all sessions" ON exam_sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'super_admin')
    )
);

-- ===============================
-- TRIGGERS AND FUNCTIONS
-- ===============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, username, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update search vector for questions
CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.text, '') || ' ' || 
        COALESCE(array_to_string(NEW.options, ' '), '') || ' ' ||
        COALESCE(NEW.explanation, '') || ' ' ||
        COALESCE(NEW.domain, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_questions_search_vector
    BEFORE INSERT OR UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_search_vector(); 