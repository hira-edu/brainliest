> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Database Schema

This document describes the PostgreSQL schema managed by Drizzle ORM. The schema is authoritative only when kept in sync with migration files and the shared domain models.

## Design Principles

- Snake_case table and column names.
- UUID primary keys unless otherwise noted.
- Strict foreign keys with cascade rules defined per entity needs.
- Timestamps (`created_at`, `updated_at`) on mutable tables.
- Soft deletes only where explicitly required (e.g., content that can be restored).
- JSONB columns limited to metadata that cannot be normalized without significant overhead.

## Entity Relationship Diagram (ERD)

> _Add generated ERD diagram (e.g., from `drizzle-kit` or `dbdiagram.io`) once schema is finalized._

## Core Tables

### `categories`
- `slug` (PK)
- `name`
- `description`
- `icon`
- `sort_order`
- `type` (enum)
- `active`
- Timestamps

### `subcategories`
- `slug` (PK)
- `category_slug` (FK → categories.slug)
- `name`
- `description`
- `icon`
- `sort_order`
- `active`
- Timestamps

### `subjects`
- `slug` (PK)
- `category_slug` (FK)
- `subcategory_slug` (FK)
- `name`
- `description`
- `icon`
- `difficulty`
- `tags` (text[])
- `active`
- `metadata` (jsonb)
- Timestamps

### `exams`
- `slug` (PK)
- `subject_slug` (FK)
- `title`
- `description`
- `duration_minutes`
- `difficulty`
- `question_target`
- `status` (enum)
- `metadata` (jsonb)
- Timestamps

### `questions`
- `id` (uuid PK)
- `exam_slug` (FK)
- `subject_slug` (FK)
- `text`
- `options` (jsonb array)
- `correct_answer` (int)
- `correct_answers` (int[])
- `allow_multiple` (bool)
- `explanation`
- `domain`
- `source`
- `year`
- `visibility` (enum)
- `metadata` (jsonb)
- Timestamps

### `question_ai_explanations`
- `id` (uuid PK)
- `question_id` (FK → questions.id)
- `answer_pattern` (hash of selected answers)
- `content`
- `model`
- `tokens_total`
- `cost_cents`
- Timestamps
- Unique constraint on (`question_id`, `answer_pattern`)

### `users`
- `id` (uuid PK)
- `email`
- `hashed_password`
- `role` (enum)
- `status` (enum)
- `profile` (jsonb)
- `email_verified_at`
- Timestamps

### `admin_users`
- `id` (uuid PK)
- `email`
- `password_hash`
- `role`
- `totp_secret`
- `last_login_at`
- `status`
- Timestamps

### `integration_keys`
- `id` (uuid PK)
- `name`
- `type` (enum)
- `value_encrypted`
- `description`
- `environment`
- `last_rotated_at`
- `created_by_admin`
- Timestamps

### `feature_flags`
- `key` (PK)
- `description`
- `enabled`
- `rollout_percentage`
- `metadata`
- Timestamps

### `exam_sessions`
- `id` (uuid PK)
- `user_id` (FK)
- `exam_slug` (FK)
- `status`
- `score_percent`
- `time_spent_seconds`
- `started_at`
- `completed_at`
- `metadata`

### `exam_session_questions`
- `session_id` (FK → exam_sessions.id)
- `question_id` (FK → questions.id)
- `order`
- `selected_answers` (int[])
- `is_correct`
- `time_spent_seconds`
- `ai_explanation_id` (FK → question_ai_explanations.id)
- Composite PK (`session_id`, `question_id`)

### `bookmarks`
- `user_id` (FK)
- `question_id` (FK)
- `notes`
- Timestamps
- Composite PK (`user_id`, `question_id`)

### `audit_logs`
- `id` (uuid PK)
- `actor_type`
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `diff` (jsonb)
- `ip_address`
- `user_agent`
- Timestamps

### `bans`
- `user_id` (FK)
- `admin_id` (FK)
- `reason`
- `expires_at`
- Timestamps

## Migrations

- Managed via Drizzle migrations stored under `packages/db/migrations`.
- Naming convention: `YYYYMMDDHHMM__short_description.sql`.
- `pnpm db:migrate` runs migrations; `pnpm db:generate` generates new migrations.
- Rollback procedures documented in `docs/ops/deployment.md`.

## Seed Data

- Base categories, subcategories, subjects seeded via script (`packages/db/seeds/base-taxonomy.ts`).
- Example questions/exams for local testing via `packages/testing/fixtures`.

## TODO

- Generate ERD once schema is implemented.
- Document indexes and performance considerations per table.
- Add link to analytics/event tables if introduced later.