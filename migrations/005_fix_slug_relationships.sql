-- Migration 005: Fix Slug-based Relationships and Data Consistency
-- Date: Current
-- Purpose: Ensure all tables use proper slug-based relationships and remove ID-based inconsistencies

-- Step 1: Add missing slug columns if they don't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS category_slug TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category_slug TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;

-- Step 2: Update categories with proper slugs if missing
UPDATE categories SET slug = 
  CASE 
    WHEN name = 'Professional Certifications' THEN 'professional-certifications'
    WHEN name = 'University & College' THEN 'university-college'
    WHEN name = 'Technology' THEN 'technology'
    WHEN name = 'Business & Management' THEN 'business-management'
    WHEN name = 'Cybersecurity' THEN 'cybersecurity'
    ELSE LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
  END
WHERE slug IS NULL OR slug = '';

-- Step 3: Update subcategories with proper slugs
UPDATE subcategories SET slug = 
  CASE 
    WHEN name = 'IT & Cloud Computing' THEN 'it-cloud-computing'
    WHEN name = 'Project Management' THEN 'project-management'
    WHEN name = 'Cloud Computing' THEN 'cloud-computing'
    WHEN name = 'Ethical Hacking' THEN 'ethical-hacking'
    WHEN name = 'Mathematics & Statistics' THEN 'mathematics-statistics'
    WHEN name = 'Natural Sciences' THEN 'natural-sciences'
    ELSE LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
  END
WHERE slug IS NULL OR slug = '';

-- Step 4: Update subcategories.category_slug based on category relationships
UPDATE subcategories SET category_slug = c.slug
FROM categories c
WHERE subcategories.category_id = c.id AND subcategories.category_slug IS NULL;

-- Step 5: Update subjects with proper category and subcategory slugs
UPDATE subjects SET category_slug = c.slug
FROM categories c
WHERE subjects.category_id = c.id AND subjects.category_slug IS NULL;

UPDATE subjects SET subcategory_slug = sc.slug
FROM subcategories sc
WHERE subjects.subcategory_id = sc.id AND subjects.subcategory_slug IS NULL;

-- Step 6: Ensure all entities have proper slugs for their primary keys
UPDATE categories SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) WHERE slug IS NULL;
UPDATE subcategories SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) WHERE slug IS NULL;
UPDATE subjects SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) WHERE slug IS NULL OR slug = '';

-- Step 7: Drop old ID-based foreign key constraints
ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS fk_subcategories_category;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS fk_subjects_category;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS fk_subjects_subcategory;

-- Step 8: Add new slug-based foreign key constraints
ALTER TABLE subcategories 
  DROP CONSTRAINT IF EXISTS fk_subcategories_category_slug;
ALTER TABLE subcategories 
  ADD CONSTRAINT fk_subcategories_category_slug 
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE;

ALTER TABLE subjects 
  DROP CONSTRAINT IF EXISTS fk_subjects_category_slug;
ALTER TABLE subjects 
  ADD CONSTRAINT fk_subjects_category_slug 
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE SET NULL;

ALTER TABLE subjects 
  DROP CONSTRAINT IF EXISTS fk_subjects_subcategory_slug;
ALTER TABLE subjects 
  ADD CONSTRAINT fk_subjects_subcategory_slug 
  FOREIGN KEY (subcategory_slug) REFERENCES subcategories(slug) ON DELETE SET NULL;

-- Step 9: Create unique constraints on slug fields
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS subcategories_slug_unique;
ALTER TABLE subcategories ADD CONSTRAINT subcategories_slug_unique UNIQUE (slug);

-- Step 10: Update indexes for better performance
DROP INDEX IF EXISTS idx_subcategories_category_slug;
CREATE INDEX idx_subcategories_category_slug ON subcategories(category_slug);

DROP INDEX IF EXISTS idx_subjects_category_slug;
CREATE INDEX idx_subjects_category_slug ON subjects(category_slug);

DROP INDEX IF EXISTS idx_subjects_subcategory_slug;
CREATE INDEX idx_subjects_subcategory_slug ON subjects(subcategory_slug);

-- Step 11: Clean up orphaned records
DELETE FROM subjects WHERE category_slug IS NOT NULL AND category_slug NOT IN (SELECT slug FROM categories);
DELETE FROM subjects WHERE subcategory_slug IS NOT NULL AND subcategory_slug NOT IN (SELECT slug FROM subcategories);
DELETE FROM subcategories WHERE category_slug NOT IN (SELECT slug FROM categories);

-- Step 12: Update exam and question references to use subject slugs
UPDATE questions SET subject_slug = s.slug
FROM subjects s
WHERE questions.subject_id = s.id AND questions.subject_slug IS NULL;

UPDATE exams SET subject_slug = s.slug
FROM subjects s
WHERE exams.subject_id = s.id AND exams.subject_slug IS NULL;

-- Step 13: Add NOT NULL constraints where appropriate
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE subcategories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE subcategories ALTER COLUMN category_slug SET NOT NULL;

-- Step 14: Create function to maintain slug consistency
CREATE OR REPLACE FUNCTION maintain_slug_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically generate slug from name if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REPLACE(REPLACE(NEW.name, ' ', '-'), '&', 'and'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to maintain slugs
DROP TRIGGER IF EXISTS maintain_category_slug ON categories;
CREATE TRIGGER maintain_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION maintain_slug_consistency();

DROP TRIGGER IF EXISTS maintain_subcategory_slug ON subcategories;
CREATE TRIGGER maintain_subcategory_slug
    BEFORE INSERT OR UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION maintain_slug_consistency();

-- Add comment for documentation
COMMENT ON TABLE categories IS 'Categories table with slug-based primary keys and relationships';
COMMENT ON TABLE subcategories IS 'Subcategories table with slug-based relationships to categories';
COMMENT ON TABLE subjects IS 'Subjects table with slug-based relationships to categories and subcategories'; 