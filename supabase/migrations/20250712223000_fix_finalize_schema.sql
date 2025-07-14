-- Step 1: Ensure difficulty enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
  END IF;
END $$;

-- Step 2: Disable triggers
ALTER TABLE public.exams DISABLE TRIGGER update_exams_updated_at;
ALTER TABLE public.questions DISABLE TRIGGER update_questions_updated_at;
ALTER TABLE public.questions DISABLE TRIGGER update_questions_search_vector_trigger;

-- Step 3: Update subjects to fix category_slug and subcategory_slug
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
END;

-- Step 4: Drop dependent constraints
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

-- Step 5: Finalize exams table
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

-- Step 6: Finalize questions table
ALTER TABLE public.questions
  RENAME COLUMN question_text TO text;
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS options,
  RENAME COLUMN new_options TO options,
  DROP COLUMN IF EXISTS correct_answer,
  RENAME COLUMN temp_correct_answer TO correct_answer,
  DROP COLUMN IF EXISTS exam_id,
  DROP COLUMN IF EXISTS subject_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS search_vector,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER[] DEFAULT ARRAY[correct_answer],
  ADD COLUMN IF NOT EXISTS allow_multiple_answers BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0,
  ALTER COLUMN exam_slug SET NOT NULL,
  ALTER COLUMN subject_slug SET NOT NULL,
  ALTER COLUMN options SET NOT NULL,
  ALTER COLUMN correct_answer SET NOT NULL,
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty),
  ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_slug) REFERENCES public.exams(slug) ON DELETE CASCADE,
  ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;

-- Step 7: Populate explanation
UPDATE public.questions
SET explanation = CASE
  WHEN exam_slug = 'algebra-basics' THEN 'Basic arithmetic operation'
  WHEN exam_slug = 'calculus-intro' THEN 'Power rule: d/dx(x^n) = n*x^(n-1)'
  WHEN exam_slug = 'mechanics-basics' THEN 'Newton''s First Law describes inertia'
END;

-- Step 8: Update order using a CTE
WITH ordered_questions AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY exam_slug ORDER BY id) AS row_num
  FROM public.questions
)
UPDATE public.questions
SET "order" = ordered_questions.row_num
FROM ordered_questions
WHERE public.questions.id = ordered_questions.id;

-- Step 9: Re-enable triggers or drop if not needed
DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
DROP TRIGGER IF EXISTS update_questions_search_vector_trigger ON public.questions;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP FUNCTION IF EXISTS update_questions_search_vector;