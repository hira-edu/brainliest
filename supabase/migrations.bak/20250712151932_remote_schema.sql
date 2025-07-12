

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."anonymize_user_data"("user_id_param" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE users SET
    email = 'anonymized_' || id || '@example.com',
    first_name = 'Anonymous',
    last_name = 'User',
    profile_image = NULL,
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
$$;


ALTER FUNCTION "public"."anonymize_user_data"("user_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission"("user_id_param" integer, "resource_type_param" "text", "permission_type_param" "text", "resource_id_param" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
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
$$;


ALTER FUNCTION "public"."check_user_permission"("user_id_param" integer, "resource_type_param" "text", "permission_type_param" "text", "resource_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_audit_log_partition"("partition_date" "date") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id)', 
                 'idx_' || partition_name || '_user_id', partition_name);
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."create_audit_log_partition"("partition_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "key_id" "text" DEFAULT 'default'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  RETURN convert_from(decrypt(decode(encrypted_data, 'hex'), 'brainliest_encryption_key_2025'::bytea, 'aes'), 'UTF8');
EXCEPTION 
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "key_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data"("data" "text", "key_id" "text" DEFAULT 'default'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(data::bytea, 'brainliest_encryption_key_2025'::bytea, 'aes'), 'hex');
END;
$$;


ALTER FUNCTION "public"."encrypt_sensitive_data"("data" "text", "key_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_data_retention"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
      WHERE (last_login_at < NOW() - INTERVAL '1 month' * policy_record.retention_period_months OR last_login_at IS NULL)
        AND retention_date IS NULL
        AND email NOT LIKE 'anonymized_%';
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      total_affected := total_affected + affected_rows;
    END IF;
    IF policy_record.table_name = 'user_sessions' AND policy_record.action_on_expiry = 'hard_delete' THEN
      DELETE FROM user_sessions 
      WHERE created_at < NOW() - INTERVAL '1 month' * policy_record.retention_period_months;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      total_affected := total_affected + affected_rows;
    END IF;
    INSERT INTO system_events (event_type, event_category, message, event_data)
    VALUES ('data_retention', 'compliance', 'Applied retention policy: ' || policy_record.policy_name,
            jsonb_build_object('policy', policy_record.policy_name, 'affected_rows', affected_rows));
  END LOOP;
  RETURN total_affected;
END;
$$;


ALTER FUNCTION "public"."enforce_data_retention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_daily_compliance_tasks"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  retention_result INTEGER;
  result_message TEXT;
BEGIN
  SELECT enforce_data_retention() INTO retention_result;
  INSERT INTO system_events (event_type, event_category, severity_level, message, event_data)
  VALUES ('compliance_automation', 'data_retention', 'info', 'Daily compliance tasks completed',
          jsonb_build_object('retention_processed', retention_result, 'execution_time', NOW()));
  result_message := 'Daily compliance tasks completed. Processed ' || retention_result || ' records.';
  RETURN result_message;
END;
$$;


ALTER FUNCTION "public"."run_daily_compliance_tasks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_questions"("search_query" "text", "limit_count" integer DEFAULT 20) RETURNS TABLE("id" integer, "question_text" "text", "subject_name" "text", "exam_title" "text", "difficulty" "text", "domain" "text", "rank" real)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    s.name AS subject_name,
    e.title AS exam_title,
    q.difficulty,
    q.domain,
    ts_rank(q.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM questions q
  JOIN subjects s ON q.subject_id = s.id
  JOIN exams e ON q.exam_id = e.id
  WHERE q.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, q.id
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."search_questions"("search_query" "text", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_subjects"("search_query" "text", "limit_count" integer DEFAULT 10) RETURNS TABLE("id" integer, "slug" "text", "name" "text", "description" "text", "exam_count" integer, "question_count" integer, "rank" real)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug,
    s.name,
    s.description,
    s.exam_count,
    s.question_count,
    ts_rank(s.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM subjects s
  WHERE s.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, s.name
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."search_subjects"("search_query" "text", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_questions_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.question_text || ' ' || COALESCE(NEW.options::TEXT, '') || ' ' || COALESCE(NEW.correct_answer, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_questions_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subjects_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.name || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subjects_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_audit" (
    "id" integer NOT NULL,
    "user_id" integer,
    "resource_type" "text" NOT NULL,
    "resource_id" integer,
    "action" "text" NOT NULL,
    "permission_granted" boolean NOT NULL,
    "denial_reason" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "timestamp" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."access_audit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."access_audit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."access_audit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."access_audit_id_seq" OWNED BY "public"."access_audit"."id";



CREATE TABLE IF NOT EXISTS "public"."access_permissions" (
    "id" integer NOT NULL,
    "role_name" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" integer,
    "permission_type" "text" NOT NULL,
    "granted_by" integer,
    "granted_at" timestamp without time zone DEFAULT "now"(),
    "expires_at" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "conditions" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "access_permissions_permission_type_check" CHECK (("permission_type" = ANY (ARRAY['read'::"text", 'write'::"text", 'delete'::"text", 'admin'::"text", 'create'::"text", 'update'::"text"])))
);


ALTER TABLE "public"."access_permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."access_permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."access_permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."access_permissions_id_seq" OWNED BY "public"."access_permissions"."id";



CREATE TABLE IF NOT EXISTS "public"."anon_question_sessions" (
    "id" integer NOT NULL,
    "ip_address" "text" NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."anon_question_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."anon_question_sessions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."anon_question_sessions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."anon_question_sessions_id_seq" OWNED BY "public"."anon_question_sessions"."id";



CREATE TABLE IF NOT EXISTS "public"."api_usage_logs" (
    "id" integer NOT NULL,
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "response_time_ms" integer,
    "user_id" integer,
    "ip_address" "inet",
    "user_agent" "text",
    "request_size_bytes" integer,
    "response_size_bytes" integer,
    "timestamp" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_usage_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_usage_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."api_usage_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_usage_logs_id_seq" OWNED BY "public"."api_usage_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" integer NOT NULL,
    "user_id" integer,
    "action" "text" NOT NULL,
    "timestamp" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_logs_partitioned" (
    "id" integer NOT NULL,
    "user_id" integer,
    "action" "text" NOT NULL,
    "timestamp" timestamp without time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("timestamp");


ALTER TABLE "public"."audit_logs_partitioned" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_partitioned_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_partitioned_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_partitioned_id_seq" OWNED BY "public"."audit_logs_partitioned"."id";



CREATE TABLE IF NOT EXISTS "public"."auth_logs" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "event_type" "text" NOT NULL,
    "timestamp" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."auth_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."auth_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."auth_logs_id_seq" OWNED BY "public"."auth_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "comment_text" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."comments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."comments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."comments_id_seq" OWNED BY "public"."comments"."id";



CREATE TABLE IF NOT EXISTS "public"."daily_trending_snapshot" (
    "id" integer NOT NULL,
    "date" "date" NOT NULL,
    "snapshot" "jsonb" NOT NULL
);


ALTER TABLE "public"."daily_trending_snapshot" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."daily_trending_snapshot_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."daily_trending_snapshot_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."daily_trending_snapshot_id_seq" OWNED BY "public"."daily_trending_snapshot"."id";



CREATE TABLE IF NOT EXISTS "public"."data_retention_policies" (
    "id" integer NOT NULL,
    "policy_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "retention_period_months" integer NOT NULL,
    "table_name" "text" NOT NULL,
    "criteria" "jsonb",
    "action_on_expiry" "text" DEFAULT 'soft_delete'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "data_retention_policies_action_on_expiry_check" CHECK (("action_on_expiry" = ANY (ARRAY['soft_delete'::"text", 'hard_delete'::"text", 'archive'::"text", 'anonymize'::"text"])))
);


ALTER TABLE "public"."data_retention_policies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."data_retention_policies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."data_retention_policies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."data_retention_policies_id_seq" OWNED BY "public"."data_retention_policies"."id";



CREATE TABLE IF NOT EXISTS "public"."detailed_answers" (
    "id" integer NOT NULL,
    "session_id" integer,
    "question_id" integer NOT NULL,
    "user_answer" "text" NOT NULL,
    "is_correct" boolean NOT NULL,
    "difficulty" "text",
    "domain" "text",
    "answered_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."detailed_answers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."detailed_answers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."detailed_answers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."detailed_answers_id_seq" OWNED BY "public"."detailed_answers"."id";



CREATE TABLE IF NOT EXISTS "public"."exam_analytics" (
    "id" integer NOT NULL,
    "session_id" integer,
    "user_id" integer NOT NULL,
    "exam_id" integer NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "completed_at" timestamp without time zone DEFAULT "now"(),
    "analysis_date" "date",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."exam_analytics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exam_analytics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exam_analytics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."exam_analytics_id_seq" OWNED BY "public"."exam_analytics"."id";



CREATE TABLE IF NOT EXISTS "public"."exams" (
    "id" integer NOT NULL,
    "slug" "text" NOT NULL,
    "subject_id" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "question_count" integer NOT NULL,
    "duration" integer,
    "difficulty" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."exams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."exams_id_seq" OWNED BY "public"."exams"."id";



CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" integer NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(10,2) NOT NULL,
    "metric_unit" "text",
    "component" "text" NOT NULL,
    "environment" "text" DEFAULT 'production'::"text",
    "timestamp" timestamp without time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."performance_metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."performance_metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."performance_metrics_id_seq" OWNED BY "public"."performance_metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."performance_trends" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "subject_id" integer,
    "trend_data" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_trends" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."performance_trends_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."performance_trends_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."performance_trends_id_seq" OWNED BY "public"."performance_trends"."id";



CREATE TABLE IF NOT EXISTS "public"."question_analytics" (
    "id" integer NOT NULL,
    "question_id" integer,
    "total_attempts" integer DEFAULT 0,
    "correct_attempts" integer DEFAULT 0,
    "accuracy_rate" numeric(5,2) DEFAULT 0,
    "average_time_seconds" numeric(8,2),
    "skip_rate" numeric(5,2) DEFAULT 0,
    "hint_usage_rate" numeric(5,2) DEFAULT 0,
    "last_updated" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."question_analytics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."question_analytics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."question_analytics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."question_analytics_id_seq" OWNED BY "public"."question_analytics"."id";



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" integer NOT NULL,
    "exam_id" integer NOT NULL,
    "subject_id" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "correct_answer" "text" NOT NULL,
    "difficulty" "text",
    "domain" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "search_vector" "tsvector"
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."questions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."questions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."questions_id_seq" OWNED BY "public"."questions"."id";



CREATE TABLE IF NOT EXISTS "public"."study_recommendations" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "recommendation" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_recommendations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."study_recommendations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."study_recommendations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."study_recommendations_id_seq" OWNED BY "public"."study_recommendations"."id";



CREATE TABLE IF NOT EXISTS "public"."subject_popularity" (
    "id" integer NOT NULL,
    "subject_id" integer,
    "date" "date" NOT NULL,
    "view_count" integer DEFAULT 0,
    "exam_starts" integer DEFAULT 0,
    "exam_completions" integer DEFAULT 0,
    "unique_users" integer DEFAULT 0,
    "avg_session_duration" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0
);


ALTER TABLE "public"."subject_popularity" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subject_popularity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subject_popularity_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subject_popularity_id_seq" OWNED BY "public"."subject_popularity"."id";



CREATE TABLE IF NOT EXISTS "public"."subject_trending_stats" (
    "id" integer NOT NULL,
    "subject_id" integer NOT NULL,
    "trending_score" integer NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE,
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."subject_trending_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subject_trending_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subject_trending_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subject_trending_stats_id_seq" OWNED BY "public"."subject_trending_stats"."id";



CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" integer NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "category_slug" "text",
    "subcategory_slug" "text",
    "exam_count" integer DEFAULT 0,
    "question_count" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "search_vector" "tsvector"
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subjects_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subjects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subjects_id_seq" OWNED BY "public"."subjects"."id";



CREATE TABLE IF NOT EXISTS "public"."system_events" (
    "id" integer NOT NULL,
    "event_type" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "severity_level" "text" DEFAULT 'info'::"text",
    "user_id" integer,
    "session_id" "text",
    "resource_type" "text",
    "resource_id" integer,
    "event_data" "jsonb",
    "message" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "timestamp" timestamp without time zone DEFAULT "now"(),
    "processed" boolean DEFAULT false,
    CONSTRAINT "system_events_severity_level_check" CHECK (("severity_level" = ANY (ARRAY['debug'::"text", 'info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."system_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."system_events_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."system_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."system_events_id_seq" OWNED BY "public"."system_events"."id";



CREATE TABLE IF NOT EXISTS "public"."uploads" (
    "id" integer NOT NULL,
    "file_name" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "upload_path" "text" NOT NULL,
    "uploaded_by" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."uploads" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."uploads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."uploads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."uploads_id_seq" OWNED BY "public"."uploads"."id";



CREATE TABLE IF NOT EXISTS "public"."user_learning_paths" (
    "id" integer NOT NULL,
    "user_id" integer,
    "subject_id" integer,
    "path_type" "text" NOT NULL,
    "current_step" integer DEFAULT 1,
    "total_steps" integer NOT NULL,
    "completion_percentage" numeric(5,2) DEFAULT 0,
    "estimated_completion_time" integer,
    "difficulty_preference" "text",
    "learning_style" "text",
    "path_data" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "completed_at" timestamp without time zone
);


ALTER TABLE "public"."user_learning_paths" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_learning_paths_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_learning_paths_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_learning_paths_id_seq" OWNED BY "public"."user_learning_paths"."id";



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "username" "text" NOT NULL,
    "bio" "text",
    "location" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_profiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_profiles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_profiles_id_seq" OWNED BY "public"."user_profiles"."id";



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "exam_id" integer NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_sessions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_sessions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_sessions_id_seq" OWNED BY "public"."user_sessions"."id";



CREATE TABLE IF NOT EXISTS "public"."user_subject_interactions" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "subject_id" integer NOT NULL,
    "interaction_type" "text" NOT NULL,
    "timestamp" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subject_interactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_subject_interactions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_subject_interactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_subject_interactions_id_seq" OWNED BY "public"."user_subject_interactions"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "username" "text" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "profile_image" "text" DEFAULT ''::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_banned" boolean DEFAULT false NOT NULL,
    "ban_reason" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "password_hash" "text",
    "email_verified" boolean DEFAULT false NOT NULL,
    "email_verification_token" "text",
    "email_verification_expires" timestamp without time zone,
    "password_reset_token" "text",
    "password_reset_expires" timestamp without time zone,
    "failed_login_attempts" integer DEFAULT 0,
    "locked_until" timestamp without time zone,
    "login_count" integer DEFAULT 0,
    "last_login_at" timestamp without time zone,
    "last_login_ip" "text" DEFAULT ''::"text" NOT NULL,
    "registration_ip" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "password_hash_encrypted" boolean DEFAULT false,
    "email_verification_token_encrypted" boolean DEFAULT false,
    "password_reset_token_encrypted" boolean DEFAULT false,
    "two_factor_secret_encrypted" boolean DEFAULT false,
    "metadata_encrypted" boolean DEFAULT false,
    "data_classification" "text" DEFAULT 'sensitive'::"text",
    "pii_fields" "text"[] DEFAULT ARRAY['email'::"text", 'first_name'::"text", 'last_name'::"text", 'profile_image'::"text"],
    "retention_date" "date",
    "data_retention_policy" "text" DEFAULT 'user_data_7_years'::"text",
    "two_factor_secret" "text",
    CONSTRAINT "users_data_classification_check" CHECK (("data_classification" = ANY (ARRAY['public'::"text", 'internal'::"text", 'sensitive'::"text", 'restricted'::"text"]))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'moderator'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



ALTER TABLE ONLY "public"."access_audit" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."access_audit_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."access_permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."access_permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."anon_question_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."anon_question_sessions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_usage_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."api_usage_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs_partitioned" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_partitioned_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."auth_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auth_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."comments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."comments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."daily_trending_snapshot" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."daily_trending_snapshot_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."data_retention_policies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."data_retention_policies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."detailed_answers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."detailed_answers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."exam_analytics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."exam_analytics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."exams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."exams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."performance_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."performance_trends" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_trends_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."question_analytics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."question_analytics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."questions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."questions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."study_recommendations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."study_recommendations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subject_popularity" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subject_popularity_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subject_trending_stats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subject_trending_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subjects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subjects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."system_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."system_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."uploads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."uploads_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_learning_paths" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_learning_paths_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_profiles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_profiles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_sessions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_subject_interactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_subject_interactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."access_audit"
    ADD CONSTRAINT "access_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_permissions"
    ADD CONSTRAINT "access_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anon_question_sessions"
    ADD CONSTRAINT "anon_question_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs_partitioned"
    ADD CONSTRAINT "audit_logs_partitioned_pkey" PRIMARY KEY ("id", "timestamp");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_logs"
    ADD CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_trending_snapshot"
    ADD CONSTRAINT "daily_trending_snapshot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_policy_name_key" UNIQUE ("policy_name");



ALTER TABLE ONLY "public"."detailed_answers"
    ADD CONSTRAINT "detailed_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_analytics"
    ADD CONSTRAINT "exam_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_trends"
    ADD CONSTRAINT "performance_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_analytics"
    ADD CONSTRAINT "question_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_recommendations"
    ADD CONSTRAINT "study_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subject_popularity"
    ADD CONSTRAINT "subject_popularity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subject_trending_stats"
    ADD CONSTRAINT "subject_trending_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."system_events"
    ADD CONSTRAINT "system_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_learning_paths"
    ADD CONSTRAINT "user_learning_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subject_interactions"
    ADD CONSTRAINT "user_subject_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



CREATE INDEX "idx_access_audit_resource_action" ON "public"."access_audit" USING "btree" ("resource_type", "action", "permission_granted");



CREATE INDEX "idx_access_audit_user_timestamp" ON "public"."access_audit" USING "btree" ("user_id", "timestamp");



CREATE INDEX "idx_access_permissions_active" ON "public"."access_permissions" USING "btree" ("is_active", "expires_at");



CREATE INDEX "idx_access_permissions_role_resource" ON "public"."access_permissions" USING "btree" ("role_name", "resource_type");



CREATE INDEX "idx_api_usage_endpoint_timestamp" ON "public"."api_usage_logs" USING "btree" ("endpoint", "timestamp");



CREATE INDEX "idx_api_usage_status_code" ON "public"."api_usage_logs" USING "btree" ("status_code");



CREATE INDEX "idx_api_usage_user_timestamp" ON "public"."api_usage_logs" USING "btree" ("user_id", "timestamp");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_comments_question_id" ON "public"."comments" USING "btree" ("question_id");



CREATE INDEX "idx_data_retention_policies_active" ON "public"."data_retention_policies" USING "btree" ("is_active", "table_name");



CREATE INDEX "idx_detailed_answers_answered_at" ON "public"."detailed_answers" USING "btree" ("answered_at");



CREATE INDEX "idx_detailed_answers_comprehensive" ON "public"."detailed_answers" USING "btree" ("session_id", "is_correct", "difficulty", "domain");



CREATE INDEX "idx_detailed_answers_difficulty" ON "public"."detailed_answers" USING "btree" ("difficulty");



CREATE INDEX "idx_detailed_answers_domain" ON "public"."detailed_answers" USING "btree" ("domain");



CREATE INDEX "idx_detailed_answers_question_id" ON "public"."detailed_answers" USING "btree" ("question_id");



CREATE INDEX "idx_detailed_answers_session_correct" ON "public"."detailed_answers" USING "btree" ("session_id", "is_correct");



CREATE INDEX "idx_detailed_answers_session_id" ON "public"."detailed_answers" USING "btree" ("session_id");



CREATE INDEX "idx_exam_analytics_completed_at" ON "public"."exam_analytics" USING "btree" ("completed_at");



CREATE INDEX "idx_exam_analytics_exam_id" ON "public"."exam_analytics" USING "btree" ("exam_id");



CREATE INDEX "idx_exam_analytics_performance" ON "public"."exam_analytics" USING "btree" ("user_id", "exam_id", "completed_at");



CREATE INDEX "idx_exam_analytics_user_exam" ON "public"."exam_analytics" USING "btree" ("user_id", "exam_id");



CREATE INDEX "idx_exam_analytics_user_id" ON "public"."exam_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_exams_is_active" ON "public"."exams" USING "btree" ("is_active");



CREATE INDEX "idx_exams_subject_active" ON "public"."exams" USING "btree" ("subject_id", "is_active");



CREATE INDEX "idx_exams_subject_id" ON "public"."exams" USING "btree" ("subject_id");



CREATE INDEX "idx_performance_metrics_component" ON "public"."performance_metrics" USING "btree" ("component");



CREATE INDEX "idx_performance_metrics_name_timestamp" ON "public"."performance_metrics" USING "btree" ("metric_name", "timestamp");



CREATE INDEX "idx_performance_trends_user_subject" ON "public"."performance_trends" USING "btree" ("user_id", "subject_id");



CREATE INDEX "idx_question_analytics_question_id" ON "public"."question_analytics" USING "btree" ("question_id");



CREATE INDEX "idx_questions_difficulty" ON "public"."questions" USING "btree" ("difficulty");



CREATE INDEX "idx_questions_domain" ON "public"."questions" USING "btree" ("domain");



CREATE INDEX "idx_questions_exam_difficulty" ON "public"."questions" USING "btree" ("exam_id", "difficulty");



CREATE INDEX "idx_questions_exam_id" ON "public"."questions" USING "btree" ("exam_id");



CREATE INDEX "idx_questions_search_vector" ON "public"."questions" USING "gin" ("search_vector");



CREATE INDEX "idx_questions_subject_domain" ON "public"."questions" USING "btree" ("subject_id", "domain");



CREATE INDEX "idx_questions_subject_id" ON "public"."questions" USING "btree" ("subject_id");



CREATE INDEX "idx_subject_popularity_subject_date" ON "public"."subject_popularity" USING "btree" ("subject_id", "date");



CREATE INDEX "idx_subjects_category_slug" ON "public"."subjects" USING "btree" ("category_slug");



CREATE INDEX "idx_subjects_search_vector" ON "public"."subjects" USING "gin" ("search_vector");



CREATE INDEX "idx_subjects_subcategory_slug" ON "public"."subjects" USING "btree" ("subcategory_slug");



CREATE INDEX "idx_system_events_severity" ON "public"."system_events" USING "btree" ("severity_level");



CREATE INDEX "idx_system_events_timestamp" ON "public"."system_events" USING "btree" ("timestamp");



CREATE INDEX "idx_system_events_type_category" ON "public"."system_events" USING "btree" ("event_type", "event_category");



CREATE INDEX "idx_system_events_user_id" ON "public"."system_events" USING "btree" ("user_id");



CREATE INDEX "idx_trending_stats_subject_date" ON "public"."subject_trending_stats" USING "btree" ("subject_id", "date");



CREATE INDEX "idx_user_interactions_subject_type" ON "public"."user_subject_interactions" USING "btree" ("subject_id", "interaction_type");



CREATE INDEX "idx_user_interactions_timestamp" ON "public"."user_subject_interactions" USING "btree" ("timestamp");



CREATE INDEX "idx_user_learning_paths_user_subject" ON "public"."user_learning_paths" USING "btree" ("user_id", "subject_id");



CREATE INDEX "idx_user_sessions_exam_id" ON "public"."user_sessions" USING "btree" ("exam_id");



CREATE INDEX "idx_users_data_classification" ON "public"."users" USING "btree" ("data_classification");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_is_banned" ON "public"."users" USING "btree" ("is_banned");



CREATE INDEX "idx_users_retention_date" ON "public"."users" USING "btree" ("retention_date") WHERE ("retention_date" IS NOT NULL);



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_exams_updated_at" BEFORE UPDATE ON "public"."exams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_questions_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_questions_search_vector"();



CREATE OR REPLACE TRIGGER "update_questions_updated_at" BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subjects_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."subjects" FOR EACH ROW EXECUTE FUNCTION "public"."update_subjects_search_vector"();



CREATE OR REPLACE TRIGGER "update_subjects_updated_at" BEFORE UPDATE ON "public"."subjects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."access_audit"
    ADD CONSTRAINT "access_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."access_permissions"
    ADD CONSTRAINT "access_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE "public"."audit_logs_partitioned"
    ADD CONSTRAINT "audit_logs_partitioned_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."auth_logs"
    ADD CONSTRAINT "auth_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."detailed_answers"
    ADD CONSTRAINT "detailed_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."detailed_answers"
    ADD CONSTRAINT "detailed_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_analytics"
    ADD CONSTRAINT "exam_analytics_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id");



ALTER TABLE ONLY "public"."exam_analytics"
    ADD CONSTRAINT "exam_analytics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_analytics"
    ADD CONSTRAINT "exam_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_trends"
    ADD CONSTRAINT "performance_trends_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id");



ALTER TABLE ONLY "public"."performance_trends"
    ADD CONSTRAINT "performance_trends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."question_analytics"
    ADD CONSTRAINT "question_analytics_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_recommendations"
    ADD CONSTRAINT "study_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."subject_popularity"
    ADD CONSTRAINT "subject_popularity_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id");



ALTER TABLE ONLY "public"."subject_trending_stats"
    ADD CONSTRAINT "subject_trending_stats_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_events"
    ADD CONSTRAINT "system_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_learning_paths"
    ADD CONSTRAINT "user_learning_paths_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id");



ALTER TABLE ONLY "public"."user_learning_paths"
    ADD CONSTRAINT "user_learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_subject_interactions"
    ADD CONSTRAINT "user_subject_interactions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subject_interactions"
    ADD CONSTRAINT "user_subject_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."anonymize_user_data"("user_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_user_data"("user_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_user_data"("user_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id_param" integer, "resource_type_param" "text", "permission_type_param" "text", "resource_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id_param" integer, "resource_type_param" "text", "permission_type_param" "text", "resource_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id_param" integer, "resource_type_param" "text", "permission_type_param" "text", "resource_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_audit_log_partition"("partition_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_audit_log_partition"("partition_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_audit_log_partition"("partition_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "key_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "key_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "key_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "key_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "key_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "key_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_daily_compliance_tasks"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_daily_compliance_tasks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_daily_compliance_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_questions"("search_query" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_questions"("search_query" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_questions"("search_query" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_subjects"("search_query" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_subjects"("search_query" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_subjects"("search_query" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_questions_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_questions_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_questions_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subjects_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subjects_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subjects_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."access_audit" TO "anon";
GRANT ALL ON TABLE "public"."access_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."access_audit" TO "service_role";



GRANT ALL ON SEQUENCE "public"."access_audit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."access_audit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."access_audit_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."access_permissions" TO "anon";
GRANT ALL ON TABLE "public"."access_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."access_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."access_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."access_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."access_permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."anon_question_sessions" TO "anon";
GRANT ALL ON TABLE "public"."anon_question_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."anon_question_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."anon_question_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."anon_question_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."anon_question_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_usage_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_usage_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_usage_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs_partitioned" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs_partitioned" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs_partitioned" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_partitioned_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_partitioned_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_partitioned_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."auth_logs" TO "anon";
GRANT ALL ON TABLE "public"."auth_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."daily_trending_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."daily_trending_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_trending_snapshot" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_trending_snapshot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_trending_snapshot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_trending_snapshot_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."data_retention_policies" TO "anon";
GRANT ALL ON TABLE "public"."data_retention_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."data_retention_policies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_retention_policies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_retention_policies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_retention_policies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."detailed_answers" TO "anon";
GRANT ALL ON TABLE "public"."detailed_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."detailed_answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."detailed_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."detailed_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."detailed_answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exam_analytics" TO "anon";
GRANT ALL ON TABLE "public"."exam_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_analytics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exam_analytics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exam_analytics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exam_analytics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exams" TO "anon";
GRANT ALL ON TABLE "public"."exams" TO "authenticated";
GRANT ALL ON TABLE "public"."exams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."performance_metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."performance_metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."performance_metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."performance_trends" TO "anon";
GRANT ALL ON TABLE "public"."performance_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_trends" TO "service_role";



GRANT ALL ON SEQUENCE "public"."performance_trends_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."performance_trends_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."performance_trends_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."question_analytics" TO "anon";
GRANT ALL ON TABLE "public"."question_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."question_analytics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."question_analytics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_analytics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_analytics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."study_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."study_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."study_recommendations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."study_recommendations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."study_recommendations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."study_recommendations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subject_popularity" TO "anon";
GRANT ALL ON TABLE "public"."subject_popularity" TO "authenticated";
GRANT ALL ON TABLE "public"."subject_popularity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subject_popularity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subject_popularity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subject_popularity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subject_trending_stats" TO "anon";
GRANT ALL ON TABLE "public"."subject_trending_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."subject_trending_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subject_trending_stats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subject_trending_stats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subject_trending_stats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_events" TO "anon";
GRANT ALL ON TABLE "public"."system_events" TO "authenticated";
GRANT ALL ON TABLE "public"."system_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."uploads" TO "anon";
GRANT ALL ON TABLE "public"."uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."uploads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."uploads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."uploads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."uploads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_learning_paths" TO "anon";
GRANT ALL ON TABLE "public"."user_learning_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."user_learning_paths" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_learning_paths_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_learning_paths_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_learning_paths_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_subject_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_subject_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subject_interactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_subject_interactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_subject_interactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_subject_interactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
