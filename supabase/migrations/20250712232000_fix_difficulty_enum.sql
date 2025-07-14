-- Step 1: Drop and recreate the difficulty enum to ensure correct values
DROP TYPE IF EXISTS public.difficulty CASCADE;
CREATE TYPE public.difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- Step 2: Alter exams table to use the new difficulty enum
ALTER TABLE public.exams
  ALTER COLUMN difficulty TYPE public.difficulty USING (
    CASE
      WHEN lower(difficulty) = 'easy' THEN 'Beginner'::public.difficulty
      WHEN lower(difficulty) = 'medium' THEN 'Intermediate'::public.difficulty
      WHEN lower(difficulty) = 'hard' THEN 'Advanced'::public.difficulty
      ELSE difficulty::public.difficulty
    END
  );

-- Step 3: Alter questions table to use the new difficulty enum
ALTER TABLE public.questions
  ALTER COLUMN difficulty TYPE public.difficulty USING (
    CASE
      WHEN lower(difficulty) = 'easy' THEN 'Beginner'::public.difficulty
      WHEN lower(difficulty) = 'medium' THEN 'Intermediate'::public.difficulty
      WHEN lower(difficulty) = 'hard' THEN 'Advanced'::public.difficulty
      ELSE difficulty::public.difficulty
    END
  );