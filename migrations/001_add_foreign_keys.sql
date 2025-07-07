-- Migration: Add Missing Foreign Key Constraints
-- Date: July 07, 2025
-- Purpose: Establish referential integrity across all table relationships

-- Add foreign key constraints with proper CASCADE behavior
-- Core content hierarchy: categories → subcategories → subjects → exams → questions

ALTER TABLE subcategories 
  ADD CONSTRAINT fk_subcategories_category 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE subjects 
  ADD CONSTRAINT fk_subjects_category 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE subjects 
  ADD CONSTRAINT fk_subjects_subcategory 
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

ALTER TABLE exams 
  ADD CONSTRAINT fk_exams_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE questions 
  ADD CONSTRAINT fk_questions_exam 
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE questions 
  ADD CONSTRAINT fk_questions_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- User session and interaction relationships
ALTER TABLE user_sessions 
  ADD CONSTRAINT fk_user_sessions_exam 
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE comments 
  ADD CONSTRAINT fk_comments_question 
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- Analytics and tracking relationships
ALTER TABLE detailed_answers 
  ADD CONSTRAINT fk_detailed_answers_session 
  FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE;

ALTER TABLE detailed_answers 
  ADD CONSTRAINT fk_detailed_answers_question 
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

ALTER TABLE exam_analytics 
  ADD CONSTRAINT fk_exam_analytics_session 
  FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE;

ALTER TABLE exam_analytics 
  ADD CONSTRAINT fk_exam_analytics_exam 
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE performance_trends 
  ADD CONSTRAINT fk_performance_trends_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE study_recommendations 
  ADD CONSTRAINT fk_study_recommendations_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- Tracking and trending relationships
ALTER TABLE user_subject_interactions 
  ADD CONSTRAINT fk_user_subject_interactions_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE user_subject_interactions 
  ADD CONSTRAINT fk_user_subject_interactions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE subject_trending_stats 
  ADD CONSTRAINT fk_subject_trending_stats_subject 
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- Add audit log user relationship
ALTER TABLE audit_logs 
  ADD CONSTRAINT fk_audit_logs_admin 
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;