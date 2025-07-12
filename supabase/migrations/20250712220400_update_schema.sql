-- Create difficulty enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
  END IF;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
  slug TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update subjects table (remove created_at, updated_at if present)
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN exam_count SET DATA TYPE INTEGER,
  ALTER COLUMN question_count SET DATA TYPE INTEGER;

-- Update exams table
ALTER TABLE public.exams
  DROP COLUMN IF EXISTS subject_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ADD COLUMN IF NOT EXISTS subject_slug TEXT NOT NULL REFERENCES public.subjects(slug),
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty);

-- Update questions table
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS exam_id,
  DROP COLUMN IF EXISTS subject_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ADD COLUMN IF NOT EXISTS exam_slug TEXT NOT NULL REFERENCES public.exams(slug),
  ADD COLUMN IF NOT EXISTS subject_slug TEXT NOT NULL REFERENCES public.subjects(slug),
  ADD COLUMN IF NOT EXISTS options TEXT[] NOT NULL,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER[],
  ADD COLUMN IF NOT EXISTS allow_multiple_answers BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0,
  ALTER COLUMN difficulty TYPE difficulty USING (difficulty::difficulty);