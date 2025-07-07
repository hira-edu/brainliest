-- Migration 004: Data Type Optimization and Field Constraints
-- Date: July 07, 2025
-- Purpose: Optimize data types, add field constraints, and improve storage efficiency

-- Phase 1: Text Field Length Optimization
-- Email fields with RFC 5321 compliance (maximum 320 characters)
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(320);
ALTER TABLE user_profiles ALTER COLUMN email TYPE VARCHAR(320);

-- Name fields with reasonable limits
ALTER TABLE users ALTER COLUMN first_name TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN last_name TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(50);
ALTER TABLE categories ALTER COLUMN name TYPE VARCHAR(200);
ALTER TABLE subcategories ALTER COLUMN name TYPE VARCHAR(200);
ALTER TABLE subjects ALTER COLUMN name TYPE VARCHAR(200);
ALTER TABLE exams ALTER COLUMN title TYPE VARCHAR(300);

-- Description fields with proper limits
ALTER TABLE categories ALTER COLUMN description TYPE VARCHAR(500);
ALTER TABLE subcategories ALTER COLUMN description TYPE VARCHAR(500);
ALTER TABLE subjects ALTER COLUMN description TYPE VARCHAR(1000);
ALTER TABLE exams ALTER COLUMN description TYPE VARCHAR(1000);

-- Phase 2: Role and Status Field Constraints (ENUM-like)
-- Clean up existing data before applying constraints
UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin', 'moderator') OR role IS NULL;
UPDATE questions SET difficulty = 'Intermediate' WHERE difficulty = 'medium';

-- Role constraint
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
ALTER TABLE users ADD CONSTRAINT check_user_role 
  CHECK (role IN ('user', 'admin', 'moderator'));

-- Difficulty standardization across tables  
ALTER TABLE questions ALTER COLUMN difficulty TYPE VARCHAR(20);
ALTER TABLE exams ALTER COLUMN difficulty TYPE VARCHAR(20);
ALTER TABLE questions ADD CONSTRAINT check_question_difficulty 
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'));
ALTER TABLE exams ADD CONSTRAINT check_exam_difficulty 
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'));

-- OAuth provider constraint
ALTER TABLE users ALTER COLUMN oauth_provider TYPE VARCHAR(20);
ALTER TABLE users ADD CONSTRAINT check_oauth_provider 
  CHECK (oauth_provider IS NULL OR oauth_provider IN ('google', 'facebook', 'github', 'microsoft'));

-- Icon and color field limits
ALTER TABLE categories ALTER COLUMN icon TYPE VARCHAR(100);
ALTER TABLE subcategories ALTER COLUMN icon TYPE VARCHAR(100);
ALTER TABLE subjects ALTER COLUMN icon TYPE VARCHAR(100);
ALTER TABLE categories ALTER COLUMN color TYPE VARCHAR(20);
ALTER TABLE subcategories ALTER COLUMN color TYPE VARCHAR(20);
ALTER TABLE subjects ALTER COLUMN color TYPE VARCHAR(20);

-- Phase 3: JSON to JSONB Conversion
-- Convert metadata fields to JSONB for better performance
ALTER TABLE users ALTER COLUMN metadata TYPE JSONB USING 
  CASE 
    WHEN metadata IS NULL OR metadata = '' THEN NULL
    ELSE metadata::JSONB
  END;

-- Add GIN index for JSONB queries
CREATE INDEX idx_users_metadata_gin ON users USING GIN(metadata) WHERE metadata IS NOT NULL;

-- Phase 4: Numeric Data Type Optimization
-- Convert percentage and score fields to proper NUMERIC types
ALTER TABLE exam_analytics ALTER COLUMN score TYPE NUMERIC(5,2) 
  USING REPLACE(score, '%', '')::NUMERIC(5,2);
  
ALTER TABLE performance_trends ALTER COLUMN average_score TYPE NUMERIC(5,2) 
  USING CASE 
    WHEN average_score IS NULL OR average_score = '' THEN NULL
    ELSE average_score::NUMERIC(5,2)
  END;

-- Convert growth percentage to numeric (removing % symbol)
ALTER TABLE subject_trending_stats ALTER COLUMN growth_percentage DROP DEFAULT;
ALTER TABLE subject_trending_stats ALTER COLUMN growth_percentage TYPE NUMERIC(5,2) 
  USING CASE 
    WHEN growth_percentage IS NULL OR growth_percentage = '' THEN 0
    ELSE REPLACE(growth_percentage, '%', '')::NUMERIC(5,2)
  END;
ALTER TABLE subject_trending_stats ALTER COLUMN growth_percentage SET DEFAULT 0;

-- Phase 5: Additional Field Constraints for Data Validation
-- Email validation constraint (basic RFC format)
ALTER TABLE users ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Username constraints (fix problematic usernames first)
UPDATE users SET username = 'user' || id::text 
WHERE username IS NULL OR length(username) < 3 OR username !~ '^[A-Za-z0-9_-]+$';

ALTER TABLE users ADD CONSTRAINT check_username_format 
  CHECK (username IS NULL OR (username ~* '^[A-Za-z0-9_-]+$' AND length(username) >= 3));

-- Question and exam count constraints (positive numbers)
ALTER TABLE exams ADD CONSTRAINT check_question_count_positive 
  CHECK (question_count > 0);
  
ALTER TABLE subjects ADD CONSTRAINT check_exam_count_non_negative 
  CHECK (exam_count >= 0);
  
ALTER TABLE subjects ADD CONSTRAINT check_question_count_non_negative 
  CHECK (question_count >= 0);

-- Duration constraint for exams (reasonable time limits)
ALTER TABLE exams ADD CONSTRAINT check_duration_reasonable 
  CHECK (duration IS NULL OR (duration > 0 AND duration <= 600)); -- Max 10 hours