-- Step 1: Ensure difficulty enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
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
  ALTER COLUMN subject_slug SET NOT NULL;

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
      ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug);
  END IF;
END $$;

-- Step 6: Rename question_text to text if necessary
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'question_text') THEN
    ALTER TABLE public.questions RENAME COLUMN question_text TO text;
  END IF;
END $$;

-- Step 7: Clean up duplicate questions
DELETE FROM public.questions
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY exam_slug, text ORDER BY id) AS rnum
    FROM public.questions
  ) t
  WHERE rnum > 1
);

-- Step 8: Ensure questions table columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'correct_answers') THEN
    ALTER TABLE public.questions ADD COLUMN correct_answers INTEGER[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'allow_multiple_answers') THEN
    ALTER TABLE public.questions ADD COLUMN allow_multiple_answers BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'explanation') THEN
    ALTER TABLE public.questions ADD COLUMN explanation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'order') THEN
    ALTER TABLE public.questions ADD COLUMN "order" INTEGER DEFAULT 0;
  END IF;
END $$;

-- Step 9: Convert options from jsonb to text[] if necessary
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'options' AND data_type = 'jsonb') THEN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS new_options TEXT[];
    UPDATE public.questions SET new_options = ARRAY[options->>'0', options->>'1', options->>'2'] WHERE options IS NOT NULL;
    ALTER TABLE public.questions DROP COLUMN options;
    ALTER TABLE public.questions RENAME COLUMN new_options TO options;
  END IF;
END $$;

-- Step 10: Ensure correct_answer is integer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'correct_answer' AND data_type != 'integer') THEN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS temp_correct_answer INTEGER;
    UPDATE public.questions SET temp_correct_answer = (correct_answer::text)::integer WHERE correct_answer IS NOT NULL;
    ALTER TABLE public.questions DROP COLUMN correct_answer;
    ALTER TABLE public.questions RENAME COLUMN temp_correct_answer TO correct_answer;
  END IF;
END $$;

-- Step 11: Update correct_answers and explanation (if not already set)
UPDATE public.questions
SET correct_answers = CASE
      WHEN correct_answers IS NULL THEN ARRAY[correct_answer]
      ELSE correct_answers
    END,
    explanation = CASE
      WHEN explanation IS NULL AND exam_slug = 'algebra-basics' THEN 'Basic arithmetic operation'
      WHEN explanation IS NULL AND exam_slug = 'calculus-intro' THEN 'Power rule: d/dx(x^n) = n*x^(n-1)'
      WHEN explanation IS NULL AND exam_slug = 'mechanics-basics' THEN 'Newton''s First Law describes inertia'
      WHEN explanation IS NULL AND exam_slug = 'aws-solutions-architect' THEN 'Availability Zones are isolated locations within a region for high availability'
      ELSE explanation
    END
WHERE exam_slug IN ('algebra-basics', 'calculus-intro', 'mechanics-basics', 'aws-solutions-architect');

-- Step 12: Finalize questions table constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_exam_slug_fkey'
    AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_slug) REFERENCES public.exams(slug);
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_subject_slug_fkey'
    AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug);
  END IF;
END $$;

ALTER TABLE public.questions
  ALTER COLUMN exam_slug SET NOT NULL,
  ALTER COLUMN subject_slug SET NOT NULL,
  ALTER COLUMN options SET NOT NULL,
  ALTER COLUMN correct_answer SET NOT NULL;