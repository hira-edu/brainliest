-- Rollback Migration 004: Data Type Optimization and Field Constraints
-- Date: July 07, 2025
-- Purpose: Rollback data type changes and constraint additions

-- WARNING: This rollback may result in data loss for fields that were converted
-- to more restrictive types. Backup database before proceeding.

-- Phase 1: Remove CHECK Constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_email_format;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_username_format;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_oauth_provider;

ALTER TABLE questions DROP CONSTRAINT IF EXISTS check_question_difficulty;
ALTER TABLE exams DROP CONSTRAINT IF EXISTS check_exam_difficulty;

ALTER TABLE exams DROP CONSTRAINT IF EXISTS check_question_count_positive;
ALTER TABLE exams DROP CONSTRAINT IF EXISTS check_duration_reasonable;

ALTER TABLE subjects DROP CONSTRAINT IF EXISTS check_exam_count_non_negative;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS check_question_count_non_negative;

-- Phase 2: Revert Data Type Changes to Original TEXT Types
-- WARNING: These commands will convert constrained VARCHAR back to unlimited TEXT

-- Revert name and description fields
ALTER TABLE categories ALTER COLUMN name TYPE TEXT;
ALTER TABLE categories ALTER COLUMN description TYPE TEXT;
ALTER TABLE categories ALTER COLUMN icon TYPE TEXT;
ALTER TABLE categories ALTER COLUMN color TYPE TEXT;

ALTER TABLE subcategories ALTER COLUMN name TYPE TEXT;
ALTER TABLE subcategories ALTER COLUMN description TYPE TEXT;
ALTER TABLE subcategories ALTER COLUMN icon TYPE TEXT;
ALTER TABLE subcategories ALTER COLUMN color TYPE TEXT;

ALTER TABLE subjects ALTER COLUMN name TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN description TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN icon TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN color TYPE TEXT;

ALTER TABLE exams ALTER COLUMN title TYPE TEXT;
ALTER TABLE exams ALTER COLUMN description TYPE TEXT;
ALTER TABLE exams ALTER COLUMN difficulty TYPE TEXT;

ALTER TABLE questions ALTER COLUMN difficulty TYPE TEXT;

-- Revert user fields
ALTER TABLE users ALTER COLUMN email TYPE TEXT;
ALTER TABLE users ALTER COLUMN username TYPE TEXT;
ALTER TABLE users ALTER COLUMN first_name TYPE TEXT;
ALTER TABLE users ALTER COLUMN last_name TYPE TEXT;
ALTER TABLE users ALTER COLUMN role TYPE TEXT;
ALTER TABLE users ALTER COLUMN oauth_provider TYPE TEXT;

ALTER TABLE user_profiles ALTER COLUMN email TYPE TEXT;

-- Phase 3: Revert JSONB back to TEXT
-- WARNING: This will lose JSONB indexing benefits
DROP INDEX IF EXISTS idx_users_metadata_gin;
ALTER TABLE users ALTER COLUMN metadata TYPE TEXT;

-- Phase 4: Revert NUMERIC types back to TEXT
-- WARNING: This will lose numeric calculation capabilities
ALTER TABLE exam_analytics ALTER COLUMN score TYPE TEXT;
ALTER TABLE performance_trends ALTER COLUMN average_score TYPE TEXT;

-- Revert growth_percentage back to TEXT with % symbol
ALTER TABLE subject_trending_stats ALTER COLUMN growth_percentage TYPE TEXT 
  USING growth_percentage::TEXT || '%';
ALTER TABLE subject_trending_stats ALTER COLUMN growth_percentage SET DEFAULT '0%';

-- Phase 5: Clean up data if needed (reverse of data fixes)
-- Note: This step is optional and depends on whether you want to restore original data

-- Optionally restore original role values (if backup exists)
-- UPDATE users SET role = original_role_backup WHERE id IN (...);

-- Optionally restore original difficulty values (if backup exists)  
-- UPDATE questions SET difficulty = 'medium' WHERE difficulty = 'Intermediate' AND original_was_medium;

-- Phase 6: Verification Queries
-- Run these to verify rollback completed successfully

-- Check that constraints were removed
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND constraint_type = 'CHECK'
  AND constraint_name LIKE 'check_%'
ORDER BY table_name, constraint_name;

-- Check data types reverted to TEXT
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'categories', 'subjects', 'exams', 'questions')
  AND column_name IN ('name', 'email', 'description', 'difficulty', 'role')
ORDER BY table_name, column_name;

-- Verify JSONB reverted to TEXT
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'metadata';

-- ROLLBACK COMPLETE
-- Remember to update your application code to handle the reverted data types