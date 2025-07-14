-- Step 1: Drop and recreate the difficulty enum to ensure correct values
DROP TYPE IF EXISTS public.difficulty CASCADE;
CREATE TYPE public.difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- Step 2: Add difficulty column to exams if it doesn't exist
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS difficulty public.difficulty NOT NULL DEFAULT 'Beginner';

-- Step 3: Add difficulty column to questions if it doesn't exist
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS difficulty public.difficulty DEFAULT NULL;