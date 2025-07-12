-- Step 1: Ensure difficulty enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
  END IF;
END $$;

-- Step 2: Drop redundant unique constraint on exams
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_slug_key;

-- Step 3: Add missing columns to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS correct_answer INTEGER NOT NULL DEFAULT 0;

-- Step 4: Populate options and correct_answer from existing data (if applicable)
UPDATE public.questions
SET options = COALESCE(CAST(jsonb_array_elements_text(jsonb_build_array('Option 1', 'Option 2', 'Option 3')) AS TEXT[]), '{}')
WHERE options = '{}';

UPDATE public.questions
SET correct_answer = 1
WHERE correct_answer = 0;

-- Step 5: Populate correct_answers
UPDATE public.questions
SET correct_answers = ARRAY[correct_answer]
WHERE correct_answers IS NULL;

-- Step 6: Verify foreign key constraints (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exams_subject_slug_fkey' AND conrelid = 'public.exams'::regclass
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_exam_slug_fkey' AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_slug) REFERENCES public.exams(slug) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_subject_slug_fkey' AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
  END IF;
END $$;