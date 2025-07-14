-- Step 1: Drop dependent constraints
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_subject_slug_fkey;
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_subject_slug_fkey;

-- Step 2: Drop id and search_vector from subjects
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS id;
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS search_vector;

-- Step 3: Update icon and color to match populate_data.sql
UPDATE public.subjects
SET
  icon = CASE
    WHEN slug = 'mathematics' THEN 'calculator'
    WHEN slug = 'physics' THEN 'flask'
    WHEN slug = 'aws-certification' THEN 'cloud'
  END,
  color = CASE
    WHEN slug = 'mathematics' THEN 'green'
    WHEN slug = 'physics' THEN 'green'
    WHEN slug = 'aws-certification' THEN 'blue'
  END
WHERE icon != CASE
    WHEN slug = 'mathematics' THEN 'calculator'
    WHEN slug = 'physics' THEN 'flask'
    WHEN slug = 'aws-certification' THEN 'cloud'
  END
  OR color != CASE
    WHEN slug = 'mathematics' THEN 'green'
    WHEN slug = 'physics' THEN 'green'
    WHEN slug = 'aws-certification' THEN 'blue'
  END;

-- Step 4: Set slug as primary key
ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE public.subjects
  ADD CONSTRAINT subjects_pkey PRIMARY KEY (slug);

-- Step 5: Re-add foreign key constraints
ALTER TABLE public.exams
  ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;