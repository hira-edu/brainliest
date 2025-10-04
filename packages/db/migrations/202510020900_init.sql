-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum definitions
CREATE TYPE category_type AS ENUM ('academic', 'professional', 'standardized');
CREATE TYPE exam_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE question_type AS ENUM ('single', 'multi');
CREATE TYPE question_asset_type AS ENUM ('image', 'audio', 'file');
CREATE TYPE user_role AS ENUM ('STUDENT', 'EDITOR', 'ADMIN', 'SUPERADMIN');
CREATE TYPE admin_role AS ENUM ('VIEWER', 'EDITOR', 'ADMIN', 'SUPERADMIN');
CREATE TYPE integration_environment AS ENUM ('production', 'staging', 'development');
CREATE TYPE integration_key_type AS ENUM (
  'OPENAI',
  'STRIPE',
  'RESEND',
  'CAPTCHA',
  'GOOGLE_RECAPTCHA_V2_SITE',
  'GOOGLE_RECAPTCHA_V2_SECRET',
  'GOOGLE_RECAPTCHA_V3_SITE',
  'GOOGLE_RECAPTCHA_V3_SECRET'
);
CREATE TYPE audit_actor_type AS ENUM ('admin', 'user', 'system');
CREATE TYPE exam_session_status AS ENUM ('in_progress', 'completed', 'abandoned', 'expired');

-- Taxonomy tables
CREATE TABLE categories (
    slug VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    type category_type NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcategories (
    slug VARCHAR(255) PRIMARY KEY,
    category_slug VARCHAR(255) NOT NULL REFERENCES categories (slug) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    slug VARCHAR(255) PRIMARY KEY,
    category_slug VARCHAR(255) NOT NULL REFERENCES categories (slug) ON DELETE CASCADE,
    subcategory_slug VARCHAR(255) REFERENCES subcategories (slug) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    difficulty exam_difficulty,
    tags TEXT[],
    active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX subjects_category_idx ON subjects (category_slug);
CREATE INDEX subjects_subcategory_idx ON subjects (subcategory_slug);

-- Exams & questions
CREATE TABLE exams (
    slug VARCHAR(255) PRIMARY KEY,
    subject_slug VARCHAR(255) NOT NULL REFERENCES subjects (slug) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    question_target INTEGER,
    difficulty exam_difficulty,
    status exam_status NOT NULL DEFAULT 'draft',
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX exams_subject_idx ON exams (subject_slug);
CREATE INDEX exams_status_idx ON exams (status);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_slug VARCHAR(255) REFERENCES exams (slug) ON DELETE SET NULL,
    subject_slug VARCHAR(255) NOT NULL REFERENCES subjects (slug) ON DELETE CASCADE,
    current_version_id UUID,
    type question_type NOT NULL,
    difficulty exam_difficulty NOT NULL,
    domain VARCHAR(255),
    source VARCHAR(255),
    copyright TEXT,
    year INTEGER,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX questions_exam_idx ON questions (exam_slug);
CREATE INDEX questions_subject_idx ON questions (subject_slug);

CREATE TABLE question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    stem_markdown TEXT NOT NULL,
    has_katex BOOLEAN NOT NULL DEFAULT FALSE,
    explanation_markdown TEXT,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id UUID NOT NULL REFERENCES question_versions (id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL,
    content_markdown TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE question_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    type question_asset_type NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_tags (
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

CREATE TABLE question_ai_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id UUID NOT NULL REFERENCES question_versions (id) ON DELETE CASCADE,
    answer_hash VARCHAR(255) NOT NULL,
    model VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    content_markdown TEXT NOT NULL,
    tokens_total INTEGER NOT NULL,
    cost_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (question_version_id, answer_hash, model, language)
);

-- Users & sessions
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    hashed_password TEXT,
    role user_role NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    profile JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role admin_role NOT NULL DEFAULT 'VIEWER',
    totp_secret TEXT,
    totp_enabled_at TIMESTAMPTZ,
    totp_last_used_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_totp_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMPTZ
);

CREATE INDEX admin_totp_recovery_codes_admin_idx ON admin_totp_recovery_codes (admin_id);

CREATE TABLE admin_remember_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ
);

CREATE INDEX admin_remember_devices_admin_idx ON admin_remember_devices (admin_id);
CREATE INDEX admin_remember_devices_expires_idx ON admin_remember_devices (expires_at);

CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exam_slug VARCHAR(255) NOT NULL REFERENCES exams (slug) ON DELETE CASCADE,
    status exam_session_status NOT NULL DEFAULT 'in_progress',
    score_percent NUMERIC(5,2),
    time_spent_seconds INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE exam_session_questions (
    session_id UUID NOT NULL REFERENCES exam_sessions (id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    selected_answers INTEGER[],
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    ai_explanation_id UUID REFERENCES question_ai_explanations (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, question_id)
);

CREATE TABLE bookmarks (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE bans (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, admin_id)
);

-- Admin & platform controls
CREATE TABLE integration_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type integration_key_type NOT NULL,
    value_encrypted TEXT NOT NULL,
    description TEXT,
    environment integration_environment NOT NULL DEFAULT 'production',
    last_rotated_at TIMESTAMPTZ,
    created_by_admin UUID REFERENCES admin_users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_flags (
    key VARCHAR(255) PRIMARY KEY,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 100,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type audit_actor_type NOT NULL,
    actor_id UUID,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    diff JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    audience VARCHAR(50) NOT NULL DEFAULT 'all',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for relational helpers
CREATE INDEX question_versions_question_idx ON question_versions (question_id);
CREATE INDEX choices_version_idx ON choices (question_version_id);
CREATE INDEX exam_session_user_idx ON exam_sessions (user_id);
CREATE INDEX exam_session_exam_idx ON exam_sessions (exam_slug);
CREATE INDEX question_assets_question_idx ON question_assets (question_id);
CREATE INDEX question_ai_explanations_version_idx ON question_ai_explanations (question_version_id);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_type, actor_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
