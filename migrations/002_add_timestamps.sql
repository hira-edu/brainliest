-- Migration: Add Missing Timestamp Columns
-- Date: July 07, 2025
-- Purpose: Add created_at and updated_at timestamps for audit trails

-- Add updated_at to tables missing it
ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE subcategories ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE subjects ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE subjects ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE exams ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE exams ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE questions ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE questions ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Create function for automatic updated_at maintenance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at 
  BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at 
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();