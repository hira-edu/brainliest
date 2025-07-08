-- Migration: Remove ID system for subjects and exams, use slug-only
-- This migration safely transitions from ID-based to slug-based primary keys
-- while preserving all data and relationships

-- Step 1: Create temporary backup tables
CREATE TABLE subjects_backup AS SELECT * FROM subjects;
CREATE TABLE exams_backup AS SELECT * FROM exams;
CREATE TABLE questions_backup AS SELECT * FROM questions;

-- Step 2: Update foreign key relationships to use slugs instead of IDs
-- First, add slug columns to relationships that reference subjects/exams
ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_slug text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject_slug text;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS exam_slug text;
ALTER TABLE exam_analytics ADD COLUMN IF NOT EXISTS exam_slug text;
ALTER TABLE performance_trends ADD COLUMN IF NOT EXISTS subject_slug text;
ALTER TABLE study_recommendations ADD COLUMN IF NOT EXISTS subject_slug text;
ALTER TABLE user_subject_interactions ADD COLUMN IF NOT EXISTS subject_slug text;
ALTER TABLE subject_trending_stats ADD COLUMN IF NOT EXISTS subject_slug text;

-- Step 3: Populate slug columns with actual slug values
UPDATE questions 
SET exam_slug = exams.slug, subject_slug = subjects.slug
FROM exams, subjects 
WHERE questions.exam_id = exams.id AND questions.subject_id = subjects.id;

UPDATE user_sessions 
SET exam_slug = exams.slug
FROM exams 
WHERE user_sessions.exam_id = exams.id;

UPDATE exam_analytics 
SET exam_slug = exams.slug
FROM exams 
WHERE exam_analytics.exam_id = exams.id;

UPDATE performance_trends 
SET subject_slug = subjects.slug
FROM subjects 
WHERE performance_trends.subject_id = subjects.id;

UPDATE study_recommendations 
SET subject_slug = subjects.slug
FROM subjects 
WHERE study_recommendations.subject_id = subjects.id;

UPDATE user_subject_interactions 
SET subject_slug = subjects.slug
FROM subjects 
WHERE user_subject_interactions.subject_id = subjects.id;

UPDATE subject_trending_stats 
SET subject_slug = subjects.slug
FROM subjects 
WHERE subject_trending_stats.subject_id = subjects.id;

-- Step 4: Update exams table to reference subjects by slug
ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_slug text;
UPDATE exams 
SET subject_slug = subjects.slug
FROM subjects 
WHERE exams.subject_id = subjects.id;

-- Step 5: Drop old foreign key constraints and ID columns
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_exam_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_subject_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_exam_id_fkey;
ALTER TABLE exam_analytics DROP CONSTRAINT IF EXISTS exam_analytics_exam_id_fkey;
ALTER TABLE performance_trends DROP CONSTRAINT IF EXISTS performance_trends_subject_id_fkey;
ALTER TABLE study_recommendations DROP CONSTRAINT IF EXISTS study_recommendations_subject_id_fkey;
ALTER TABLE user_subject_interactions DROP CONSTRAINT IF EXISTS user_subject_interactions_subject_id_fkey;
ALTER TABLE subject_trending_stats DROP CONSTRAINT IF EXISTS subject_trending_stats_subject_id_fkey;
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_subject_id_fkey;

-- Step 6: Make slug columns NOT NULL and set as required
ALTER TABLE questions ALTER COLUMN exam_slug SET NOT NULL;
ALTER TABLE questions ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE user_sessions ALTER COLUMN exam_slug SET NOT NULL;
ALTER TABLE exam_analytics ALTER COLUMN exam_slug SET NOT NULL;
ALTER TABLE performance_trends ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE study_recommendations ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE user_subject_interactions ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE subject_trending_stats ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE exams ALTER COLUMN subject_slug SET NOT NULL;

-- Step 7: Drop old ID-based columns
ALTER TABLE questions DROP COLUMN IF EXISTS exam_id;
ALTER TABLE questions DROP COLUMN IF EXISTS subject_id;
ALTER TABLE user_sessions DROP COLUMN IF EXISTS exam_id;
ALTER TABLE exam_analytics DROP COLUMN IF EXISTS exam_id;
ALTER TABLE performance_trends DROP COLUMN IF EXISTS subject_id;
ALTER TABLE study_recommendations DROP COLUMN IF EXISTS subject_id;
ALTER TABLE user_subject_interactions DROP COLUMN IF EXISTS subject_id;
ALTER TABLE subject_trending_stats DROP COLUMN IF EXISTS subject_id;
ALTER TABLE exams DROP COLUMN IF EXISTS subject_id;

-- Step 8: Recreate subjects table with slug as primary key
CREATE TABLE subjects_new (
    slug text PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    category_id integer,
    subcategory_id integer,
    exam_count integer DEFAULT 0,
    question_count integer DEFAULT 0
);

-- Step 9: Copy data to new subjects table
INSERT INTO subjects_new (slug, name, description, icon, color, category_id, subcategory_id, exam_count, question_count)
SELECT slug, name, description, icon, color, category_id, subcategory_id, exam_count, question_count
FROM subjects;

-- Step 10: Drop old subjects table and rename new one
DROP TABLE subjects;
ALTER TABLE subjects_new RENAME TO subjects;

-- Step 11: Recreate exams table with slug as primary key
CREATE TABLE exams_new (
    slug text PRIMARY KEY,
    subject_slug text NOT NULL,
    title text NOT NULL,
    description text,
    question_count integer NOT NULL,
    duration integer,
    difficulty text NOT NULL,
    is_active boolean DEFAULT true
);

-- Step 12: Copy data to new exams table
INSERT INTO exams_new (slug, subject_slug, title, description, question_count, duration, difficulty, is_active)
SELECT slug, subject_slug, title, description, question_count, duration, difficulty, is_active
FROM exams;

-- Step 13: Drop old exams table and rename new one
DROP TABLE exams;
ALTER TABLE exams_new RENAME TO exams;

-- Step 14: Add foreign key constraints for slug-based relationships
ALTER TABLE exams ADD CONSTRAINT exams_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

ALTER TABLE questions ADD CONSTRAINT questions_exam_slug_fkey 
    FOREIGN KEY (exam_slug) REFERENCES exams(slug) ON DELETE CASCADE;

ALTER TABLE questions ADD CONSTRAINT questions_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_exam_slug_fkey 
    FOREIGN KEY (exam_slug) REFERENCES exams(slug) ON DELETE CASCADE;

ALTER TABLE exam_analytics ADD CONSTRAINT exam_analytics_exam_slug_fkey 
    FOREIGN KEY (exam_slug) REFERENCES exams(slug) ON DELETE CASCADE;

ALTER TABLE performance_trends ADD CONSTRAINT performance_trends_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

ALTER TABLE study_recommendations ADD CONSTRAINT study_recommendations_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

ALTER TABLE user_subject_interactions ADD CONSTRAINT user_subject_interactions_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

ALTER TABLE subject_trending_stats ADD CONSTRAINT subject_trending_stats_subject_slug_fkey 
    FOREIGN KEY (subject_slug) REFERENCES subjects(slug) ON DELETE CASCADE;

-- Step 15: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_exam_slug ON questions(exam_slug);
CREATE INDEX IF NOT EXISTS idx_questions_subject_slug ON questions(subject_slug);
CREATE INDEX IF NOT EXISTS idx_exams_subject_slug ON exams(subject_slug);
CREATE INDEX IF NOT EXISTS idx_user_sessions_exam_slug ON user_sessions(exam_slug);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_exam_slug ON exam_analytics(exam_slug);
CREATE INDEX IF NOT EXISTS idx_performance_trends_subject_slug ON performance_trends(subject_slug);
CREATE INDEX IF NOT EXISTS idx_study_recommendations_subject_slug ON study_recommendations(subject_slug);
CREATE INDEX IF NOT EXISTS idx_user_subject_interactions_subject_slug ON user_subject_interactions(subject_slug);
CREATE INDEX IF NOT EXISTS idx_subject_trending_stats_subject_slug ON subject_trending_stats(subject_slug);

-- Step 16: Clean up backup tables (optional - keep for rollback if needed)
-- DROP TABLE subjects_backup;
-- DROP TABLE exams_backup;
-- DROP TABLE questions_backup;

-- Migration completed successfully
-- All subjects and exams now use slug as primary key
-- Questions still maintain their ID-based primary key
-- All relationships now use slugs instead of IDs for subjects and exams