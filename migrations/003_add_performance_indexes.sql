-- Migration: Add Critical Performance Indexes
-- Date: July 07, 2025
-- Purpose: Optimize query performance for high-frequency operations

-- Core relationship indexes for content hierarchy
CREATE INDEX CONCURRENTLY idx_subjects_category_id ON subjects(category_id);
CREATE INDEX CONCURRENTLY idx_subjects_subcategory_id ON subjects(subcategory_id);
CREATE INDEX CONCURRENTLY idx_exams_subject_id ON exams(subject_id);
CREATE INDEX CONCURRENTLY idx_questions_exam_id ON questions(exam_id);
CREATE INDEX CONCURRENTLY idx_questions_subject_id ON questions(subject_id);

-- User interaction indexes
CREATE INDEX CONCURRENTLY idx_comments_question_id ON comments(question_id);
CREATE INDEX CONCURRENTLY idx_user_sessions_exam_id ON user_sessions(exam_id);
CREATE INDEX CONCURRENTLY idx_user_sessions_user_name ON user_sessions(user_name);

-- Analytics and performance tracking indexes
CREATE INDEX CONCURRENTLY idx_detailed_answers_session_id ON detailed_answers(session_id);
CREATE INDEX CONCURRENTLY idx_detailed_answers_question_id ON detailed_answers(question_id);
CREATE INDEX CONCURRENTLY idx_exam_analytics_user_name ON exam_analytics(user_name);
CREATE INDEX CONCURRENTLY idx_exam_analytics_exam_id ON exam_analytics(exam_id);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_performance_trends_user_subject 
  ON performance_trends(user_name, subject_id);
CREATE INDEX CONCURRENTLY idx_user_interactions_subject_type 
  ON user_subject_interactions(subject_id, interaction_type);
CREATE INDEX CONCURRENTLY idx_trending_stats_subject_date 
  ON subject_trending_stats(subject_id, date);

-- Time-based indexes for analytics queries
CREATE INDEX CONCURRENTLY idx_detailed_answers_answered_at 
  ON detailed_answers(answered_at);
CREATE INDEX CONCURRENTLY idx_exam_analytics_completed_at 
  ON exam_analytics(completed_at);
CREATE INDEX CONCURRENTLY idx_user_interactions_timestamp 
  ON user_subject_interactions(timestamp);

-- Status and filtering indexes
CREATE INDEX CONCURRENTLY idx_exams_is_active ON exams(is_active);
CREATE INDEX CONCURRENTLY idx_categories_is_active ON categories(is_active);
CREATE INDEX CONCURRENTLY idx_subcategories_is_active ON subcategories(is_active);
CREATE INDEX CONCURRENTLY idx_users_is_active ON users(is_active);
CREATE INDEX CONCURRENTLY idx_users_is_banned ON users(is_banned);

-- Domain and difficulty indexes for analytics
CREATE INDEX CONCURRENTLY idx_questions_domain ON questions(domain);
CREATE INDEX CONCURRENTLY idx_questions_difficulty ON questions(difficulty);
CREATE INDEX CONCURRENTLY idx_detailed_answers_domain ON detailed_answers(domain);
CREATE INDEX CONCURRENTLY idx_detailed_answers_difficulty ON detailed_answers(difficulty);

-- Comprehensive analytics composite index
CREATE INDEX CONCURRENTLY idx_detailed_answers_comprehensive 
  ON detailed_answers(session_id, is_correct, difficulty, domain);

-- User performance tracking composite index
CREATE INDEX CONCURRENTLY idx_exam_analytics_performance 
  ON exam_analytics(user_name, exam_id, completed_at);

-- Trending analysis time series index
CREATE INDEX CONCURRENTLY idx_trends_time_series 
  ON performance_trends(subject_id, week, user_name);

-- Additional composite indexes for complex filtering
CREATE INDEX CONCURRENTLY idx_exams_subject_active 
  ON exams(subject_id, is_active);
CREATE INDEX CONCURRENTLY idx_questions_exam_difficulty 
  ON questions(exam_id, difficulty);
CREATE INDEX CONCURRENTLY idx_questions_subject_domain 
  ON questions(subject_id, domain);

-- Analytics performance indexes for dashboard queries
CREATE INDEX CONCURRENTLY idx_detailed_answers_session_correct 
  ON detailed_answers(session_id, is_correct);
CREATE INDEX CONCURRENTLY idx_exam_analytics_user_exam 
  ON exam_analytics(user_name, exam_id);

-- Remove redundant index to optimize write performance
DROP INDEX IF EXISTS idx_auth_sessions_token;