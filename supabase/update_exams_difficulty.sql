UPDATE public.exams
SET difficulty = CASE
  WHEN slug = 'calculus-intro' THEN 'Intermediate'::public.difficulty
  WHEN slug = 'mechanics-basics' THEN 'Intermediate'::public.difficulty
  WHEN slug = 'aws-solutions-architect' THEN 'Advanced'::public.difficulty
  ELSE 'Beginner'::public.difficulty
END
WHERE slug IN ('algebra-basics', 'calculus-intro', 'mechanics-basics', 'aws-solutions-architect');