-- Step 1: Drop dependent foreign key constraint to allow dropping exams_slug_key
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_exam_slug_fkey;

-- Step 2: Drop redundant unique constraint on exams
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_slug_key;

-- Step 3: Re-add questions_exam_slug_fkey
ALTER TABLE public.questions
  ADD CONSTRAINT questions_exam_slug_fkey FOREIGN KEY (exam_slug) REFERENCES public.exams(slug) ON DELETE CASCADE;

-- Step 4: Update options for existing questions
UPDATE public.questions
SET options = ARRAY['Option 1', 'Option 2', 'Option 3']
WHERE options = '{}';

-- Step 5: Update correct_answer for existing questions
UPDATE public.questions
SET correct_answer = 1
WHERE correct_answer = 0;

-- Step 6: Ensure correct_answers is populated
UPDATE public.questions
SET correct_answers = ARRAY[correct_answer]
WHERE correct_answers IS NULL OR correct_answers = '{}';