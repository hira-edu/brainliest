-- Migration 005: Advanced Database Features
-- Date: July 07, 2025
-- Purpose: Implement full-text search, table partitioning, and advanced analytics

-- Phase 1: Full-Text Search Implementation
-- Add search vector columns for full-text search
ALTER TABLE questions ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Update search vectors with initial data
UPDATE questions SET search_vector = to_tsvector('english', 
  text || ' ' || COALESCE(explanation, '') || ' ' || COALESCE(domain, ''));

UPDATE subjects SET search_vector = to_tsvector('english', 
  name || ' ' || COALESCE(description, ''));

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS idx_questions_search_vector ON questions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_subjects_search_vector ON subjects USING GIN(search_vector);

-- Create triggers to automatically maintain search vectors
CREATE OR REPLACE FUNCTION update_questions_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.text || ' ' || COALESCE(NEW.explanation, '') || ' ' || COALESCE(NEW.domain, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_subjects_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.name || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_questions_search_vector_trigger ON questions;
DROP TRIGGER IF EXISTS update_subjects_search_vector_trigger ON subjects;

CREATE TRIGGER update_questions_search_vector_trigger
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_questions_search_vector();

CREATE TRIGGER update_subjects_search_vector_trigger
  BEFORE INSERT OR UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_subjects_search_vector();

-- Phase 2: Table Partitioning for Analytics Scalability
-- Create partitioned audit logs table
CREATE TABLE IF NOT EXISTS audit_logs_partitioned (
  id SERIAL,
  admin_id INTEGER,
  admin_email VARCHAR(320) NOT NULL,
  action TEXT NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for audit logs
CREATE TABLE IF NOT EXISTS audit_logs_2025_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_03 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_07 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

-- Create partitioned user interactions table
CREATE TABLE IF NOT EXISTS user_interactions_partitioned (
  id SERIAL,
  user_id INTEGER,
  session_id TEXT,
  subject_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create weekly partitions for user interactions
CREATE TABLE IF NOT EXISTS user_interactions_2025_w01 PARTITION OF user_interactions_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-01-08');
CREATE TABLE IF NOT EXISTS user_interactions_2025_w28 PARTITION OF user_interactions_partitioned
  FOR VALUES FROM ('2025-07-07') TO ('2025-07-14');
CREATE TABLE IF NOT EXISTS user_interactions_2025_w29 PARTITION OF user_interactions_partitioned
  FOR VALUES FROM ('2025-07-14') TO ('2025-07-21');

-- Phase 3: Advanced Audit Trail Tables
-- System events for comprehensive tracking
CREATE TABLE IF NOT EXISTS system_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  severity_level VARCHAR(20) DEFAULT 'info' CHECK (severity_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  user_id INTEGER REFERENCES users(id),
  session_id TEXT,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  event_data JSONB,
  message TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(10,2) NOT NULL,
  metric_unit VARCHAR(20),
  component VARCHAR(50) NOT NULL,
  environment VARCHAR(20) DEFAULT 'production',
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(200) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  user_id INTEGER REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Phase 4: Advanced Analytics Tables
-- User learning paths
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject_id INTEGER REFERENCES subjects(id),
  path_type VARCHAR(50) NOT NULL,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  estimated_completion_time INTEGER,
  difficulty_preference VARCHAR(20),
  learning_style VARCHAR(50),
  path_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Question difficulty analytics
CREATE TABLE IF NOT EXISTS question_analytics (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2) DEFAULT 0,
  average_time_seconds NUMERIC(8,2),
  skip_rate NUMERIC(5,2) DEFAULT 0,
  hint_usage_rate NUMERIC(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Subject popularity tracking
CREATE TABLE IF NOT EXISTS subject_popularity (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  exam_starts INTEGER DEFAULT 0,
  exam_completions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0
);

-- Phase 5: Create indexes for analytics tables
-- System events indexes
CREATE INDEX IF NOT EXISTS idx_system_events_type_category ON system_events(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_events_user_id ON system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity_level);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp ON performance_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component ON performance_metrics(component);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_timestamp ON api_usage_logs(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_timestamp ON api_usage_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage_logs(status_code);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_user_subject ON user_learning_paths(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_question_id ON question_analytics(question_id);
CREATE INDEX IF NOT EXISTS idx_subject_popularity_subject_date ON subject_popularity(subject_id, date);

-- Partitioned table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_part_timestamp ON audit_logs_partitioned(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_part_subject ON user_interactions_partitioned(subject_id, timestamp);

-- Phase 6: Search Functions
-- Function to search questions with ranking
CREATE OR REPLACE FUNCTION search_questions(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id INTEGER,
  text TEXT,
  subject_name VARCHAR(200),
  exam_title VARCHAR(300),
  difficulty TEXT,
  domain TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.text,
    s.name as subject_name,
    e.title as exam_title,
    q.difficulty,
    q.domain,
    ts_rank(q.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM questions q
  JOIN subjects s ON q.subject_id = s.id
  JOIN exams e ON q.exam_id = e.id
  WHERE q.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, q.id
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search subjects with ranking
CREATE OR REPLACE FUNCTION search_subjects(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(200),
  description TEXT,
  exam_count INTEGER,
  question_count INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.exam_count,
    s.question_count,
    ts_rank(s.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM subjects s
  WHERE s.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Phase 7: Partition Management Functions
-- Function to create new audit log partitions automatically
CREATE OR REPLACE FUNCTION create_audit_log_partition(partition_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := DATE_TRUNC('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date);
  
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (timestamp)', 
    'idx_' || partition_name || '_timestamp', partition_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (admin_id)', 
    'idx_' || partition_name || '_admin_id', partition_name);
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;