-- Fix Question Comments Table Schema
-- Created: 2024-12-25
-- Purpose: Fix question_comments.question_id to use UUID instead of INTEGER to match questions.id

-- Drop existing question_comments table if it exists
DROP TABLE IF EXISTS question_comments CASCADE;

-- Recreate question_comments table with correct UUID type
CREATE TABLE question_comments (
    id SERIAL PRIMARY KEY,
    question_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint to questions table
    CONSTRAINT fk_question_comments_question_id 
        FOREIGN KEY (question_id) 
        REFERENCES questions(id) 
        ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_comments_question_uuid ON question_comments(question_id);
CREATE INDEX IF NOT EXISTS idx_question_comments_approved ON question_comments(is_approved) WHERE is_approved = true;

-- Add trigger for updated_at
CREATE TRIGGER update_question_comments_updated_at 
    BEFORE UPDATE ON question_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question comments
CREATE POLICY "Anyone can view approved comments" ON question_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can add comments" ON question_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage all comments" ON question_comments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Re-insert sample comments with correct UUID references
INSERT INTO question_comments (question_id, author_name, content, is_approved) 
SELECT 
    q.id,
    'John Doe',
    'Great question! This really helped clarify the concept.',
    true
FROM questions q 
WHERE q.exam_slug = 'pmp-fundamentals' 
AND q."order" = 1
LIMIT 1;

INSERT INTO question_comments (question_id, author_name, content, is_approved) 
SELECT 
    q.id,
    'Jane Smith',
    'Could you provide more examples of this concept?',
    true
FROM questions q 
WHERE q.exam_slug = 'pmp-fundamentals' 
AND q."order" = 2
LIMIT 1;

INSERT INTO question_comments (question_id, author_name, content, is_approved) 
SELECT 
    q.id,
    'Mike Johnson',
    'The explanation could be more detailed.',
    true
FROM questions q 
WHERE q.exam_slug = 'aws-basics' 
AND q."order" = 1
LIMIT 1; 