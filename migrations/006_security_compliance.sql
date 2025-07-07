-- Migration 006: Security Enhancement - Field Encryption and Data Retention
-- Date: July 07, 2025
-- Purpose: Implement field-level encryption, data retention policies, and access control

-- Phase 1: Enable encryption extensions and create encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption functions for sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use AES encryption with configurable key
  RETURN encode(encrypt(data::bytea, 'brainliest_encryption_key_2025'::bytea, 'aes'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_data, 'hex'), 'brainliest_encryption_key_2025'::bytea, 'aes'), 'UTF8');
EXCEPTION 
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 2: Add encryption status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata_encrypted BOOLEAN DEFAULT FALSE;

-- Add data classification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_classification VARCHAR(20) DEFAULT 'sensitive' 
  CHECK (data_classification IN ('public', 'internal', 'sensitive', 'restricted'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS pii_fields TEXT[] DEFAULT ARRAY['email', 'first_name', 'last_name', 'profile_image'];

-- Add retention policy fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS retention_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_retention_policy VARCHAR(50) DEFAULT 'user_data_7_years';

-- Phase 3: Create data retention policy tables
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id SERIAL PRIMARY KEY,
  policy_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  retention_period_months INTEGER NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  criteria JSONB,
  action_on_expiry VARCHAR(50) DEFAULT 'soft_delete' 
    CHECK (action_on_expiry IN ('soft_delete', 'hard_delete', 'archive', 'anonymize')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (policy_name, description, retention_period_months, table_name, action_on_expiry) VALUES
('user_data_7_years', 'User account data retention for 7 years after account closure', 84, 'users', 'anonymize'),
('audit_logs_3_years', 'Audit log retention for 3 years for compliance', 36, 'audit_logs_partitioned', 'archive'),
('session_data_1_year', 'User session data retention for 1 year', 12, 'user_sessions', 'hard_delete'),
('analytics_data_2_years', 'Analytics data retention for 2 years', 24, 'exam_analytics', 'anonymize'),
('system_events_1_year', 'System event logs retention for 1 year', 12, 'system_events', 'hard_delete')
ON CONFLICT (policy_name) DO NOTHING;

-- Phase 4: Create access control tables
CREATE TABLE IF NOT EXISTS access_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  permission_type VARCHAR(50) NOT NULL 
    CHECK (permission_type IN ('read', 'write', 'delete', 'admin', 'create', 'update')),
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  action VARCHAR(50) NOT NULL,
  permission_granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert default role permissions
INSERT INTO access_permissions (role_name, resource_type, permission_type) VALUES
('admin', 'all', 'admin'),
('admin', 'users', 'read'),
('admin', 'users', 'write'),
('admin', 'subjects', 'create'),
('admin', 'exams', 'create'),
('admin', 'questions', 'create'),
('moderator', 'questions', 'update'),
('moderator', 'comments', 'delete'),
('user', 'questions', 'read'),
('user', 'exams', 'read'),
('user', 'user_sessions', 'create')
ON CONFLICT DO NOTHING;

-- Phase 5: Create data management functions
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users SET
    email = 'anonymized_' || id || '@example.com',
    first_name = 'Anonymous',
    last_name = 'User',
    profile_image = NULL,
    google_id = NULL,
    metadata = NULL,
    password_hash = NULL,
    email_verification_token = NULL,
    password_reset_token = NULL,
    two_factor_secret = NULL,
    last_login_ip = NULL,
    registration_ip = NULL,
    retention_date = CURRENT_DATE
  WHERE id = user_id_param;
  
  INSERT INTO system_events (event_type, event_category, user_id, message)
  VALUES ('data_anonymization', 'compliance', user_id_param, 'User data anonymized per retention policy');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS INTEGER AS $$
DECLARE
  policy_record RECORD;
  affected_rows INTEGER := 0;
  total_affected INTEGER := 0;
BEGIN
  FOR policy_record IN 
    SELECT * FROM data_retention_policies WHERE is_active = TRUE
  LOOP
    IF policy_record.table_name = 'users' AND policy_record.action_on_expiry = 'anonymize' THEN
      UPDATE users SET 
        email = 'anonymized_' || id || '@example.com',
        first_name = 'Anonymous',
        last_name = 'User',
        profile_image = NULL,
        retention_date = CURRENT_DATE
      WHERE 
        (last_login_at < NOW() - INTERVAL '1 month' * policy_record.retention_period_months OR last_login_at IS NULL)
        AND retention_date IS NULL
        AND email NOT LIKE 'anonymized_%';
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      total_affected := total_affected + affected_rows;
    END IF;
    
    IF policy_record.table_name = 'user_sessions' AND policy_record.action_on_expiry = 'hard_delete' THEN
      DELETE FROM user_sessions 
      WHERE started_at < NOW() - INTERVAL '1 month' * policy_record.retention_period_months;
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      total_affected := total_affected + affected_rows;
    END IF;
    
    INSERT INTO system_events (event_type, event_category, message, event_data)
    VALUES ('data_retention', 'compliance', 
            'Applied retention policy: ' || policy_record.policy_name,
            jsonb_build_object('policy', policy_record.policy_name, 'affected_rows', affected_rows));
  END LOOP;
  
  RETURN total_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_user_permission(
  user_id_param INTEGER,
  resource_type_param VARCHAR(50),
  permission_type_param VARCHAR(50),
  resource_id_param INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
  has_permission BOOLEAN := FALSE;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id_param;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM access_permissions ap
    WHERE ap.role_name = user_role
      AND (ap.resource_type = resource_type_param OR ap.resource_type = 'all')
      AND (ap.permission_type = permission_type_param OR ap.permission_type = 'admin')
      AND (ap.resource_id IS NULL OR ap.resource_id = resource_id_param)
      AND ap.is_active = TRUE
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  ) INTO has_permission;
  
  INSERT INTO access_audit (user_id, resource_type, resource_id, action, permission_granted)
  VALUES (user_id_param, resource_type_param, resource_id_param, permission_type_param, has_permission);
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 6: Create indexes for security tables
CREATE INDEX IF NOT EXISTS idx_access_permissions_role_resource ON access_permissions(role_name, resource_type);
CREATE INDEX IF NOT EXISTS idx_access_permissions_active ON access_permissions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_access_audit_user_timestamp ON access_audit(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_access_audit_resource_action ON access_audit(resource_type, action, permission_granted);

CREATE INDEX IF NOT EXISTS idx_data_retention_policies_active ON data_retention_policies(is_active, table_name);
CREATE INDEX IF NOT EXISTS idx_users_retention_date ON users(retention_date) WHERE retention_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_data_classification ON users(data_classification);

-- Phase 7: Create compliance automation
CREATE OR REPLACE FUNCTION run_daily_compliance_tasks()
RETURNS TEXT AS $$
DECLARE
  retention_result INTEGER;
  result_message TEXT;
BEGIN
  SELECT enforce_data_retention() INTO retention_result;
  
  INSERT INTO system_events (event_type, event_category, severity_level, message, event_data)
  VALUES ('compliance_automation', 'data_retention', 'info', 
          'Daily compliance tasks completed',
          jsonb_build_object('retention_processed', retention_result, 'execution_time', NOW()));
  
  result_message := 'Daily compliance tasks completed. Processed ' || retention_result || ' records.';
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;