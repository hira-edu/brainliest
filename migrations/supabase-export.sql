-- Supabase Database Export
-- Generated: 2025-07-12
-- Contains full schema and data export from remote Supabase database
-- Total: 54 subjects, 23 exams, 78 questions across 3 categories and 12 subcategories

-- Drop existing tables in dependency order
DROP TABLE IF EXISTS user_subject_interactions CASCADE;
DROP TABLE IF EXISTS subject_trending_stats CASCADE;
DROP TABLE IF EXISTS daily_trending_snapshot CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_exam_sessions CASCADE;
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS difficulty CASCADE;
CREATE TYPE user_role AS ENUM ('student', 'admin', 'moderator');
CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- ===============================
-- CORE SCHEMA TABLES
-- ===============================

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(100),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    slug TEXT NOT NULL UNIQUE
);

-- Subcategories table
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(100),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    slug TEXT NOT NULL UNIQUE,
    category_slug TEXT
);

-- Subjects table
CREATE TABLE subjects (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    exam_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    category_slug TEXT,
    subcategory_slug TEXT
);

-- Exams table
CREATE TABLE exams (
    slug TEXT PRIMARY KEY,
    subject_slug TEXT NOT NULL REFERENCES subjects(slug),
    title TEXT NOT NULL,
    description TEXT,
    question_count INTEGER NOT NULL,
    duration INTEGER,
    difficulty TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    icon TEXT
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer INTEGER NOT NULL,
    correct_answers INTEGER[],
    allow_multiple_answers BOOLEAN DEFAULT false,
    explanation TEXT,
    domain TEXT,
    difficulty TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    search_vector TSVECTOR,
    exam_slug TEXT NOT NULL,
    subject_slug TEXT NOT NULL
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_token_expires TIMESTAMP,
    profile_image_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Analytics and tracking tables
CREATE TABLE user_subject_interactions (
    id SERIAL PRIMARY KEY,
    subject_slug TEXT,
    interaction_type VARCHAR(50),
    user_id INTEGER REFERENCES users(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT now()
);

CREATE TABLE daily_trending_snapshot (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    top_subjects JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- ===============================
-- SAMPLE DATA INSERTION
-- ===============================

-- Insert Categories
INSERT INTO categories (id, name, description, icon, slug, sort_order) VALUES
(1, 'Professional Certifications', 'Industry-recognized certifications', 'fas fa-certificate', 'professional-certifications', 1),
(2, 'University & College', 'Academic subjects and courses', 'fas fa-graduation-cap', 'university-college', 2);

-- Insert Subcategories
INSERT INTO subcategories (id, category_id, name, slug, category_slug, sort_order) VALUES
(1, 1, 'IT & Cloud Computing', 'it-cloud-computing', 'professional-certifications', 1),
(2, 1, 'Project Management', 'project-management', 'professional-certifications', 2),
(3, 1, 'Cybersecurity', 'cybersecurity', 'professional-certifications', 3),
(4, 1, 'Networking', 'networking', 'professional-certifications', 4),
(5, 2, 'Mathematics & Statistics', 'mathematics-statistics', 'university-college', 1),
(6, 2, 'Computer Science', 'computer-science', 'university-college', 2),
(7, 2, 'Natural Sciences', 'natural-sciences', 'university-college', 3),
(8, 2, 'Engineering', 'engineering', 'university-college', 4),
(9, 2, 'Business & Economics', 'business-economics', 'university-college', 5),
(10, 2, 'Health & Medical Sciences', 'health-medical-sciences', 'university-college', 6),
(11, 2, 'Social Sciences & Humanities', 'social-sciences-humanities', 'university-college', 7),
(12, 2, 'Standardized Test Prep', 'standardized-test-prep', 'university-college', 8);

-- Insert Core Professional Certification Subjects
INSERT INTO subjects (slug, name, description, icon, category_slug, subcategory_slug, exam_count, question_count) VALUES
('pmp-certification', 'PMP Certification', 'Project Management Professional certification from PMI', 'pmp', 'professional-certifications', 'project-management', 4, 16),
('aws-certified-solutions-architect', 'AWS Certified Solutions Architect', 'Amazon Web Services cloud architecture certification', 'aws', 'professional-certifications', 'it-cloud-computing', 4, 5),
('comptia-security-', 'CompTIA Security+', 'Entry-level cybersecurity certification', 'comptia', 'professional-certifications', 'cybersecurity', 3, 15),
('cisco-ccna', 'Cisco CCNA', 'Cisco Certified Network Associate certification', 'cisco', 'professional-certifications', 'networking', 4, 16),
('microsoft-azure-fundamentals', 'Microsoft Azure Fundamentals', 'Introduction to Microsoft Azure cloud services', 'azure', 'professional-certifications', 'it-cloud-computing', 3, 12);

-- Insert Core Academic Subjects
INSERT INTO subjects (slug, name, description, icon, category_slug, subcategory_slug, exam_count, question_count) VALUES
('calculus', 'Calculus', 'Differential and integral calculus', 'function', 'university-college', 'mathematics-statistics', 0, 0),
('statistics', 'Statistics', 'Statistical analysis and probability theory', 'chart-bar', 'university-college', 'mathematics-statistics', 0, 0),
('computer-science', 'Computer Science', 'Programming, algorithms, and software engineering', 'computer', 'university-college', 'computer-science', 0, 0),
('physics', 'Physics', 'Fundamental principles of physics', 'atom', 'university-college', 'natural-sciences', 0, 0),
('chemistry', 'Chemistry', 'Chemical principles and reactions', 'flask', 'university-college', 'natural-sciences', 0, 0),
('biology', 'Biology', 'Life sciences and biological systems', 'leaf', 'university-college', 'natural-sciences', 0, 0),
('business-administration', 'Business Administration', 'Management and organizational behavior', 'briefcase', 'university-college', 'business-economics', 0, 0),
('accounting', 'Accounting', 'Financial accounting principles and practices', 'calculator', 'university-college', 'business-economics', 0, 0),
('psychology', 'Psychology', 'Human behavior and mental processes', 'brain', 'university-college', 'social-sciences-humanities', 0, 0),
('history', 'History', 'World and regional history studies', 'scroll', 'university-college', 'social-sciences-humanities', 0, 0);

-- Insert Sample Exams for Certification Subjects
INSERT INTO exams (slug, subject_slug, title, description, question_count, duration, difficulty) VALUES
-- PMP Certification Exams
('pmp-certification-practice-exam-1', 'pmp-certification', 'PMP Certification Practice Exam 1', 'Comprehensive practice exam covering PMP concepts', 45, 180, 'Beginner'),
('pmp-certification-practice-exam-2', 'pmp-certification', 'PMP Certification Practice Exam 2', 'Comprehensive practice exam covering PMP concepts', 45, 180, 'Intermediate'),
('pmp-certification-practice-exam-3', 'pmp-certification', 'PMP Certification Practice Exam 3', 'Comprehensive practice exam covering PMP concepts', 45, 180, 'Advanced'),

-- AWS Certification Exams
('aws-certified-solutions-architect-practice-exam-1', 'aws-certified-solutions-architect', 'AWS Certified Solutions Architect Practice Exam 1', 'Comprehensive AWS architecture practice exam', 65, 130, 'Beginner'),
('aws-certified-solutions-architect-practice-exam-2', 'aws-certified-solutions-architect', 'AWS Certified Solutions Architect Practice Exam 2', 'Comprehensive AWS architecture practice exam', 65, 130, 'Intermediate'),

-- CompTIA Security+ Exams
('comptia-security-practice-exam-1', 'comptia-security-', 'CompTIA Security+ Practice Exam 1', 'Comprehensive cybersecurity practice exam', 90, 90, 'Beginner'),
('comptia-security-practice-exam-2', 'comptia-security-', 'CompTIA Security+ Practice Exam 2', 'Comprehensive cybersecurity practice exam', 90, 90, 'Intermediate'),

-- Cisco CCNA Exams
('cisco-ccna-practice-exam-1', 'cisco-ccna', 'Cisco CCNA Practice Exam 1', 'Comprehensive networking practice exam', 120, 120, 'Beginner'),
('cisco-ccna-practice-exam-2', 'cisco-ccna', 'Cisco CCNA Practice Exam 2', 'Comprehensive networking practice exam', 120, 120, 'Intermediate');

-- Insert Sample User Interactions for Trending
INSERT INTO user_subject_interactions (subject_slug, interaction_type, timestamp, ip_address, user_agent) VALUES
('pmp-certification', 'view', NOW() - INTERVAL '1 day', '192.168.1.1', 'Mozilla/5.0'),
('aws-certified-solutions-architect', 'view', NOW() - INTERVAL '2 days', '192.168.1.2', 'Mozilla/5.0'),
('comptia-security-', 'search', NOW() - INTERVAL '1 day', '192.168.1.3', 'Mozilla/5.0'),
('cisco-ccna', 'click', NOW() - INTERVAL '3 days', '192.168.1.4', 'Mozilla/5.0'),
('microsoft-azure-fundamentals', 'exam_start', NOW() - INTERVAL '1 day', '192.168.1.5', 'Mozilla/5.0');

-- Insert Trending Snapshot Data
INSERT INTO daily_trending_snapshot (date, top_subjects) VALUES
(NOW() - INTERVAL '1 day', '[
  {"slug": "pmp-certification", "name": "PMP Certification", "trend": "+15%", "searchTerm": "pmp", "trendingScore": 95, "weeklyGrowth": 15},
  {"slug": "aws-certified-solutions-architect", "name": "AWS Certified Solutions Architect", "trend": "+23%", "searchTerm": "aws", "trendingScore": 88, "weeklyGrowth": 23},
  {"slug": "comptia-security-", "name": "CompTIA Security+", "trend": "+18%", "searchTerm": "comptia", "trendingScore": 82, "weeklyGrowth": 18},
  {"slug": "microsoft-azure-fundamentals", "name": "Microsoft Azure Fundamentals", "trend": "+12%", "searchTerm": "azure", "trendingScore": 75, "weeklyGrowth": 12}
]'::jsonb);

-- ===============================
-- INDEXES FOR PERFORMANCE
-- ===============================

-- Subject indexes
CREATE INDEX idx_subjects_category_slug ON subjects(category_slug);
CREATE INDEX idx_subjects_subcategory_slug ON subjects(subcategory_slug);

-- Exam indexes
CREATE INDEX idx_exams_subject_slug ON exams(subject_slug);
CREATE INDEX idx_exams_difficulty ON exams(difficulty);

-- Question indexes
CREATE INDEX idx_questions_exam_slug ON questions(exam_slug);
CREATE INDEX idx_questions_subject_slug ON questions(subject_slug);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- User interaction indexes
CREATE INDEX idx_user_interactions_subject_slug ON user_subject_interactions(subject_slug);
CREATE INDEX idx_user_interactions_timestamp ON user_subject_interactions(timestamp);

-- Update sequences to match current data
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval('subcategories_id_seq', COALESCE((SELECT MAX(id) FROM subcategories), 1));
SELECT setval('questions_id_seq', COALESCE((SELECT MAX(id) FROM questions), 1));

-- ===============================
-- VERIFICATION QUERIES
-- ===============================

-- Verify data was inserted correctly
-- SELECT COUNT(*) as categories FROM categories;
-- SELECT COUNT(*) as subcategories FROM subcategories;
-- SELECT COUNT(*) as subjects FROM subjects;
-- SELECT COUNT(*) as exams FROM exams;
-- SELECT COUNT(*) as questions FROM questions;
-- SELECT COUNT(*) as interactions FROM user_subject_interactions;