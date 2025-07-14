-- Step 1: Drop the update_subjects_search_vector function and trigger
DROP TRIGGER IF EXISTS update_subjects_search_vector_trigger ON public.subjects;
DROP FUNCTION IF EXISTS update_subjects_search_vector;

-- Step 2: Drop dependent foreign key constraints
ALTER TABLE public.performance_trends
  DROP CONSTRAINT IF EXISTS performance_trends_subject_id_fkey;
ALTER TABLE public.user_subject_interactions
  DROP CONSTRAINT IF EXISTS user_subject_interactions_subject_id_fkey;
ALTER TABLE public.subject_trending_stats
  DROP CONSTRAINT IF EXISTS subject_trending_stats_subject_id_fkey;
ALTER TABLE public.user_learning_paths
  DROP CONSTRAINT IF EXISTS user_learning_paths_subject_id_fkey;
ALTER TABLE public.subject_popularity
  DROP CONSTRAINT IF EXISTS subject_popularity_subject_id_fkey;

-- Step 3: Drop existing foreign key constraints on exams and questions
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_subject_slug_fkey;
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_subject_slug_fkey;

-- Step 4: Update dependent tables to use subject_slug (text) instead of subject_id
ALTER TABLE public.performance_trends
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.user_subject_interactions
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.subject_trending_stats
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.user_learning_paths
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.subject_popularity
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  DROP COLUMN IF EXISTS subject_id;

-- Step 5: Drop id and search_vector from subjects
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS id;
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS search_vector;

-- Step 6: Update icon and color to match populate_data.sql
UPDATE public.subjects
SET
  icon = CASE
    WHEN slug = 'mathematics' THEN 'calculator'
    WHEN slug = 'physics' THEN 'flask'
    WHEN slug = 'aws-certification' THEN 'cloud'
    ELSE icon
  END,
  color = CASE
    WHEN slug = 'mathematics' THEN 'green'
    WHEN slug = 'physics' THEN 'green'
    WHEN slug = 'aws-certification' THEN 'blue'
    ELSE color
  END
WHERE icon != CASE
    WHEN slug = 'mathematics' THEN 'calculator'
    WHEN slug = 'physics' THEN 'flask'
    WHEN slug = 'aws-certification' THEN 'cloud'
    ELSE icon
  END
  OR color != CASE
    WHEN slug = 'mathematics' THEN 'green'
    WHEN slug = 'physics' THEN 'green'
    WHEN slug = 'aws-certification' THEN 'blue'
    ELSE color
  END;

-- Step 7: Set slug as primary key
ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE public.subjects
  ADD CONSTRAINT subjects_pkey PRIMARY KEY (slug);

-- Step 8: Re-add foreign key constraints
ALTER TABLE public.exams
  ADD CONSTRAINT exams_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.performance_trends
  ADD CONSTRAINT performance_trends_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.user_subject_interactions
  ADD CONSTRAINT user_subject_interactions_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.subject_trending_stats
  ADD CONSTRAINT subject_trending_stats_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.user_learning_paths
  ADD CONSTRAINT user_learning_paths_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;
ALTER TABLE public.subject_popularity
  ADD CONSTRAINT subject_popularity_subject_slug_fkey FOREIGN KEY (subject_slug) REFERENCES public.subjects(slug) ON DELETE CASCADE;