-- Step 1: Update foreign key constraints in dependent tables to reference exams.slug
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exam_analytics_exam_id_fkey'
    AND conrelid = 'public.exam_analytics'::regclass
  ) THEN
    ALTER TABLE public.exam_analytics
      DROP CONSTRAINT exam_analytics_exam_id_fkey,
      ALTER COLUMN exam_id TYPE TEXT,
      ADD CONSTRAINT exam_analytics_exam_slug_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(slug) ON DELETE CASCADE;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_sessions_exam_id_fkey'
    AND conrelid = 'public.user_sessions'::regclass
  ) THEN
    ALTER TABLE public.user_sessions
      DROP CONSTRAINT user_sessions_exam_id_fkey,
      ALTER COLUMN exam_id TYPE TEXT,
      ADD CONSTRAINT user_sessions_exam_slug_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(slug) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Update subjects to fix category_slug and subcategory_slug
UPDATE public.subjects
SET category_slug = CASE
  WHEN slug = 'mathematics' THEN 'academic'
  WHEN slug = 'physics' THEN 'academic'
  WHEN slug = 'aws-certification' THEN 'professional'
  ELSE category_slug
END,
subcategory_slug = CASE
  WHEN slug = 'mathematics' THEN 'mathematics-statistics'
  WHEN slug = 'physics' THEN 'natural-sciences'
  WHEN slug = 'aws-certification' THEN 'it-cloud'
  ELSE subcategory_slug
END
WHERE slug IN ('mathematics', 'physics', 'aws-certification');

-- Step 3: Update icon column in exams (if not already set)
UPDATE public.exams
SET icon = CASE
  WHEN slug = 'algebra-basics' THEN 'calculator'
  WHEN slug = 'calculus-intro' THEN 'calculator'
  WHEN slug = 'mechanics-basics' THEN 'flask'
  WHEN slug = 'aws-solutions-architect' THEN 'cloud'
  ELSE icon
END
WHERE slug IN ('algebra-basics', 'calculus-intro', 'mechanics-basics', 'aws-solutions-architect');

-- Step 4: Finalize exams table
ALTER TABLE public.exams
  DROP COLUMN IF EXISTS subject_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN subject_slug SET NOT NULL,
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty);

-- Step 5: Add foreign key constraint for exams if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exams_subject_slug_fkey'
    AND conrelid = 'public.exams'::regclass
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 6: Update foreign key constraints in questions to reference slug-based keys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_exam_id_fkey'
    AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      DROP CONSTRAINT questions_exam_id_fkey,
      ALTER COLUMN exam_id TYPE TEXT,
      ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(slug) ON DELETE CASCADE;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_subject_id_fkey'
    AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      DROP CONSTRAINT questions_subject_id_fkey,
      ALTER COLUMN subject_id TYPE TEXT,
      ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(slug) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 7: Finalize questions table
ALTER TABLE public.questions
  ALTER COLUMN exam_id SET NOT NULL,
  ALTER COLUMN subject_id SET NOT NULL,
  ALTER COLUMN options SET NOT NULL,
  ALTER COLUMN correct_answer SET NOT NULL;