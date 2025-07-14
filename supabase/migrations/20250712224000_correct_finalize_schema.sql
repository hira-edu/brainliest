-- Step 1: Ensure difficulty enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
  END IF;
END $$;

-- Step 2: Drop dependent triggers and functions
ALTER TABLE public.subjects DISABLE TRIGGER ALL;
ALTER TABLE public.users DISABLE TRIGGER ALL;
ALTER TABLE public.comments DISABLE TRIGGER ALL;
ALTER TABLE public.exams DISABLE TRIGGER ALL;
ALTER TABLE public.questions DISABLE TRIGGER ALL;

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
DROP TRIGGER IF EXISTS update_questions_search_vector_trigger ON public.questions;

DROP FUNCTION IF EXISTS update_updated_at_column;
DROP FUNCTION IF EXISTS update_questions_search_vector;

-- Step 3: Drop updated_at from dependent tables
ALTER TABLE public.subjects DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.comments DROP COLUMN IF EXISTS updated_at;

-- Step 4: Update subjects to fix category_slug and subcategory_slug (idempotent)
UPDATE public.subjects
SET category_slug = CASE
  WHEN slug = 'mathematics' THEN 'academic'
  WHEN slug = 'physics' THEN 'academic'
  WHEN slug = 'aws-certification' THEN 'professional'
END,
subcategory_slug = CASE
  WHEN slug = 'mathematics' THEN 'mathematics-statistics'
  WHEN slug = 'physics' THEN 'natural-sciences'
  WHEN slug = 'aws-certification' THEN 'it-cloud'
END
WHERE category_slug != CASE
  WHEN slug = 'mathematics' THEN 'academic'
  WHEN slug = 'physics' THEN 'academic'
  WHEN slug = 'aws-certification' THEN 'professional'
END
OR subcategory_slug != CASE
  WHEN slug = 'mathematics' THEN 'mathematics-statistics'
  WHEN slug = 'physics' THEN 'natural-sciences'
  WHEN slug = 'aws-certification' THEN 'it-cloud'
END;

-- Step 5: Drop dependent constraints
ALTER TABLE public.exam_analytics
  DROP CONSTRAINT IF EXISTS exam_analytics_exam_id_fkey;
ALTER TABLE public.user_sessions
  DROP CONSTRAINT IF EXISTS user_sessions_exam_id_fkey;
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_question_id_fkey;
ALTER TABLE public.detailed_answers
  DROP CONSTRAINT IF EXISTS detailed_answers_question_id_fkey;
ALTER TABLE public.question_analytics
  DROP CONSTRAINT IF EXISTS question_analytics_question_id_fkey;

ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_subject_id_fkey;
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_exam_id_fkey,
  DROP CONSTRAINT IF EXISTS questions_subject_id_fkey;

-- Step 6: Finalize exams table
ALTER TABLE public.exams
  DROP COLUMN IF EXISTS id,
  DROP COLUMN IF EXISTS subject_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN subject_slug SET NOT NULL,
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty),
  ADD CONSTRAINT exams_pkey PRIMARY KEY (slug),
  ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;

-- Step 7: Finalize questions table
ALTER TABLE public.questions
  RENAME COLUMN question_text TO text;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS options;
ALTER TABLE public.questions
  RENAME COLUMN new_options TO options;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS correct_answer;
ALTER TABLE public.questions
  RENAME COLUMN temp_correct_answer TO correct_answer;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS exam_id;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS search_vector;
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER[] DEFAULT ARRAY[correct_answer];
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS allow_multiple_answers BOOLEAN DEFAULT false;
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE public.questions
  ALTER COLUMN exam_slug SET NOT NULL;
ALTER TABLE public.questions
  ALTER COLUMN subject_slug SET NOT NULL;
ALTER TABLE public.questions
  ALTER COLUMN options SET NOT NULL;
ALTER TABLE public.questions
  ALTER COLUMN correct_answer SET NOT NULL;
ALTER TABLE public.questions
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty);
ALTER TABLE public.questions
  ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_slug) REFERENCES public.exams(slug) ON DELETE CASCADE;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;

-- Step 8: Populate explanation
UPDATE public.questions
SET explanation = CASE
  WHEN exam_slug = 'algebra-basics' THEN 'Basic arithmetic operation'
  WHEN exam_slug = 'calculus-intro' THEN 'Power rule: d/dx(x^n) = n*x^(n-1)'
  WHEN exam_slug = 'mechanics-basics' THEN 'Newton''s First Law describes inertia'
END;

-- Step 9: Update order using a CTE
WITH ordered_questions AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY exam_slug ORDER BY id) AS row_num
  FROM public.questions
)
UPDATE public.questions
SET "order" = ordered_questions.row_num
FROM ordered_questions
WHERE public.questions.id = ordered_questions.id;

-- Step 10: Re-enable triggers for other tables
ALTER TABLE public.subjects ENABLE TRIGGER ALL;
ALTER TABLE public.users ENABLE TRIGGER ALL;
ALTER TABLE public.comments ENABLE TRIGGER ALL;
ALTER TABLE public.exams ENABLE TRIGGER ALL;
ALTER TABLE public.questions ENABLE TRIGGER ALL;