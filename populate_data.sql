-- Insert categories
INSERT INTO public.categories (slug, name, description, icon, color, is_active, sort_order)
SELECT
  'professional', 'Professional Certifications', 'Industry-recognized certifications for career advancement', 'award', 'blue', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'professional');

INSERT INTO public.categories (slug, name, description, icon, color, is_active, sort_order)
SELECT
  'academic', 'University & College', 'Academic subjects for students and learners', 'graduation-cap', 'green', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'academic');

INSERT INTO public.categories (slug, name, description, icon, color, is_active, sort_order)
SELECT
  'other', 'Other Subjects', 'Miscellaneous subjects', 'folder', 'gray', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'other');

-- Insert subcategories
INSERT INTO public.subcategories (slug, category_slug, name, description, icon, color, is_active, sort_order)
SELECT
  'it-cloud', 'professional', 'IT & Cloud Computing', 'AWS, Azure, Google Cloud, and other cloud platforms', 'cloud', 'blue', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.subcategories WHERE slug = 'it-cloud');

INSERT INTO public.subcategories (slug, category_slug, name, description, icon, color, is_active, sort_order)
SELECT
  'mathematics-statistics', 'academic', 'Mathematics & Statistics', 'Calculus, Algebra, Statistics, and Mathematical Sciences', 'calculator', 'green', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.subcategories WHERE slug = 'mathematics-statistics');

INSERT INTO public.subcategories (slug, category_slug, name, description, icon, color, is_active, sort_order)
SELECT
  'natural-sciences', 'academic', 'Natural Sciences', 'Physics, Chemistry, Biology, and Earth Sciences', 'flask', 'green', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.subcategories WHERE slug = 'natural-sciences');

-- Insert subjects
INSERT INTO public.subjects (slug, name, description, icon, color, category_slug, subcategory_slug, exam_count, question_count)
SELECT
  'mathematics', 'Mathematics', 'Core mathematics concepts', 'calculator', 'green', 'academic', 'mathematics-statistics', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE slug = 'mathematics');

INSERT INTO public.subjects (slug, name, description, icon, color, category_slug, subcategory_slug, exam_count, question_count)
SELECT
  'physics', 'Physics', 'Fundamental physics principles', 'flask', 'green', 'academic', 'natural-sciences', 1, 5
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE slug = 'physics');

INSERT INTO public.subjects (slug, name, description, icon, color, category_slug, subcategory_slug, exam_count, question_count)
SELECT
  'aws-certification', 'AWS Certification', 'AWS cloud computing certification', 'cloud', 'blue', 'professional', 'it-cloud', 1, 5
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE slug = 'aws-certification');

-- Insert exams
INSERT INTO public.exams (slug, subject_slug, title, description, icon, question_count, duration, difficulty, is_active)
SELECT
  'algebra-basics', 'mathematics', 'Algebra Basics', 'Introduction to Algebra', 'calculator', 5, 60, 'Beginner', true
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE slug = 'algebra-basics');

INSERT INTO public.exams (slug, subject_slug, title, description, icon, question_count, duration, difficulty, is_active)
SELECT
  'calculus-intro', 'mathematics', 'Calculus Intro', 'Introduction to Calculus', 'calculator', 5, 90, 'Intermediate', true
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE slug = 'calculus-intro');

INSERT INTO public.exams (slug, subject_slug, title, description, icon, question_count, duration, difficulty, is_active)
SELECT
  'mechanics-basics', 'physics', 'Mechanics Basics', 'Introduction to Mechanics', 'flask', 5, 60, 'Beginner', true
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE slug = 'mechanics-basics');

INSERT INTO public.exams (slug, subject_slug, title, description, icon, question_count, duration, difficulty, is_active)
SELECT
  'aws-solutions-architect', 'aws-certification', 'AWS Solutions Architect', 'AWS Solutions Architect Associate', 'cloud', 5, 120, 'Advanced', true
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE slug = 'aws-solutions-architect');

-- Update existing questions
UPDATE public.questions
SET
  options = CASE
    WHEN exam_slug = 'algebra-basics' THEN ARRAY['3', '4', '5']
    WHEN exam_slug = 'calculus-intro' THEN ARRAY['x', '2x', 'x^2']
    WHEN exam_slug = 'mechanics-basics' THEN ARRAY['F=ma', 'An object at rest stays at rest', 'For every action, there is an equal and opposite reaction']
    ELSE ARRAY['Option 1', 'Option 2', 'Option 3']
  END,
  correct_answer = 1,
  correct_answers = ARRAY[1],
  explanation = CASE
    WHEN exam_slug = 'algebra-basics' THEN 'Basic arithmetic operation'
    WHEN exam_slug = 'calculus-intro' THEN 'Power rule: d/dx(x^n) = n*x^(n-1)'
    WHEN exam_slug = 'mechanics-basics' THEN 'Newton''s First Law describes inertia'
    ELSE 'Default explanation'
  END,
  difficulty = CASE
    WHEN exam_slug = 'algebra-basics' THEN 'Beginner'
    WHEN exam_slug = 'calculus-intro' THEN 'Intermediate'
    WHEN exam_slug = 'mechanics-basics' THEN 'Beginner'
    ELSE 'Beginner'
  END::difficulty,
  domain = CASE
    WHEN exam_slug = 'algebra-basics' THEN 'algebra'
    WHEN exam_slug = 'calculus-intro' THEN 'calculus'
    WHEN exam_slug = 'mechanics-basics' THEN 'mechanics'
    ELSE 'general'
  END
WHERE exam_slug IN ('algebra-basics', 'calculus-intro', 'mechanics-basics');

-- Insert new question for aws-solutions-architect
INSERT INTO public.questions (exam_slug, subject_slug, text, options, correct_answer, correct_answers, allow_multiple_answers, explanation, difficulty, domain, "order")
SELECT
  'aws-solutions-architect', 'aws-certification', 'What is an AWS Availability Zone?', ARRAY['A region', 'An isolated location within a region', 'A global endpoint'], 1, ARRAY[1], false, 'Availability Zones are isolated locations within a region for high availability', 'Advanced', 'cloud-computing', 1
WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE exam_slug = 'aws-solutions-architect' AND text = 'What is an AWS Availability Zone?');