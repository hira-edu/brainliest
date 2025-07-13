-- Supabase Seed Data
-- Purpose: Populate initial data for development and testing

-- Insert Categories
INSERT INTO categories (slug, name, description, icon, color, is_active, sort_order) VALUES
('professional-certifications', 'Professional Certifications', 'Industry-recognized certifications for career advancement', 'award', '#3B82F6', true, 1),
('university-college', 'University & College', 'Academic subjects for students and learners', 'graduation-cap', '#059669', true, 2),
('test-preparation', 'Test Preparation', 'Standardized test prep materials', 'clipboard-list', '#7C3AED', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories
INSERT INTO subcategories (slug, category_slug, name, description, icon, color, is_active, sort_order) VALUES
('it-cloud-computing', 'professional-certifications', 'IT & Cloud Computing', 'AWS, Azure, Google Cloud, and other cloud platforms', 'cloud', '#3B82F6', true, 1),
('project-management', 'professional-certifications', 'Project Management', 'PMP, Agile, Scrum, and project management certifications', 'calendar', '#059669', true, 2),
('cybersecurity', 'professional-certifications', 'Cybersecurity', 'Information security and ethical hacking certifications', 'shield', '#DC2626', true, 3),
('networking', 'professional-certifications', 'Networking', 'Cisco, CompTIA Network+, and networking certifications', 'network', '#F59E0B', true, 4),
('mathematics-statistics', 'university-college', 'Mathematics & Statistics', 'Calculus, Algebra, Statistics, and Mathematical Sciences', 'calculator', '#059669', true, 1),
('natural-sciences', 'university-college', 'Natural Sciences', 'Physics, Chemistry, Biology, and Earth Sciences', 'flask', '#10B981', true, 2),
('computer-science', 'university-college', 'Computer Science', 'Programming, Data Structures, Algorithms, and CS fundamentals', 'code', '#6366F1', true, 3),
('business-economics', 'university-college', 'Business & Economics', 'Business Administration, Economics, and Finance', 'briefcase', '#8B5CF6', true, 4),
('standardized-tests', 'test-preparation', 'Standardized Tests', 'SAT, ACT, GRE, GMAT, and other standardized test prep', 'clipboard-check', '#7C3AED', true, 1),
('professional-exams', 'test-preparation', 'Professional Exam Prep', 'CPA, LSAT, MCAT, and professional licensing exams', 'file-text', '#EC4899', true, 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Subjects
INSERT INTO subjects (slug, name, description, icon, color, category_slug, subcategory_slug, exam_count, question_count, is_active) VALUES
('pmp-certification', 'PMP Certification', 'Project Management Professional certification preparation', 'award', '#059669', 'professional-certifications', 'project-management', 5, 250, true),
('aws-cloud-practitioner', 'AWS Cloud Practitioner', 'Amazon Web Services Cloud Practitioner certification', 'cloud', '#FF9900', 'professional-certifications', 'it-cloud-computing', 4, 180, true),
('comptia-security-plus', 'CompTIA Security+', 'CompTIA Security+ certification for cybersecurity fundamentals', 'shield', '#DC2626', 'professional-certifications', 'cybersecurity', 6, 320, true),
('cisco-ccna', 'Cisco CCNA', 'Cisco Certified Network Associate certification', 'network', '#1BA0D7', 'professional-certifications', 'networking', 8, 450, true),
('calculus-1', 'Calculus I', 'Introduction to differential and integral calculus', 'calculator', '#059669', 'university-college', 'mathematics-statistics', 3, 150, true),
('general-chemistry', 'General Chemistry', 'Fundamental principles of chemistry', 'flask', '#10B981', 'university-college', 'natural-sciences', 4, 200, true),
('data-structures-algorithms', 'Data Structures & Algorithms', 'Computer science fundamentals: data structures and algorithms', 'code', '#6366F1', 'university-college', 'computer-science', 6, 300, true),
('microeconomics', 'Microeconomics', 'Principles of microeconomic theory and applications', 'trending-up', '#8B5CF6', 'university-college', 'business-economics', 5, 220, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Exams
INSERT INTO exams (slug, subject_slug, title, description, question_count, duration, difficulty, is_active) VALUES
('pmp-practice-exam-1', 'pmp-certification', 'PMP Practice Exam 1', 'Comprehensive PMP practice exam covering all knowledge areas', 50, 90, 'Intermediate', true),
('pmp-practice-exam-2', 'pmp-certification', 'PMP Practice Exam 2', 'Advanced PMP practice exam with scenario-based questions', 50, 90, 'Advanced', true),
('aws-cp-fundamentals', 'aws-cloud-practitioner', 'AWS Cloud Fundamentals', 'Basic AWS Cloud Practitioner concepts and services', 30, 45, 'Beginner', true),
('aws-cp-practice-test', 'aws-cloud-practitioner', 'AWS CP Practice Test', 'Full-length AWS Cloud Practitioner practice test', 65, 90, 'Intermediate', true),
('security-plus-basics', 'comptia-security-plus', 'Security+ Fundamentals', 'CompTIA Security+ basic concepts and terminology', 40, 60, 'Beginner', true),
('security-plus-advanced', 'comptia-security-plus', 'Security+ Advanced Topics', 'Advanced Security+ topics including cryptography and risk management', 50, 75, 'Advanced', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Questions (limited set for demonstration)
INSERT INTO questions (exam_slug, subject_slug, text, options, correct_answer, explanation, domain, difficulty, "order") VALUES
('pmp-practice-exam-1', 'pmp-certification', 
'What is the primary purpose of a project charter?', 
ARRAY['To define project scope in detail', 'To formally authorize the project', 'To create the work breakdown structure', 'To assign team responsibilities'], 
1, 
'The project charter formally authorizes the project and provides the project manager with authority to apply organizational resources to project activities.',
'Initiating', 'Intermediate', 1),

('pmp-practice-exam-1', 'pmp-certification',
'Which process group contains the most processes?',
ARRAY['Planning', 'Executing', 'Monitoring and Controlling', 'Closing'],
0,
'The Planning process group contains the most processes (24 out of 49 total processes) as it involves detailed planning for all knowledge areas.',
'Planning', 'Beginner', 2),

('aws-cp-fundamentals', 'aws-cloud-practitioner',
'What does the AWS Well-Architected Framework help with?',
ARRAY['Cost optimization only', 'Security best practices only', 'Building reliable, secure, efficient systems', 'Database design patterns'],
2,
'The AWS Well-Architected Framework provides guidance for building reliable, secure, efficient, and cost-effective systems in the cloud.',
'Cloud Concepts', 'Beginner', 1),

('security-plus-basics', 'comptia-security-plus',
'What is the primary goal of confidentiality in the CIA triad?',
ARRAY['Ensuring data accuracy', 'Preventing unauthorized disclosure', 'Maintaining system uptime', 'Tracking user activities'],
1,
'Confidentiality ensures that data is not disclosed to unauthorized individuals, processes, or devices.',
'Security Fundamentals', 'Beginner', 1)
ON CONFLICT DO NOTHING;

-- Create a default admin user profile (for testing)
-- Note: This would typically be created through Supabase Auth signup
INSERT INTO user_profiles (id, username, first_name, last_name, role, is_active) 
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin',
    'System',
    'Administrator',
    'super_admin',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Grant necessary permissions for the admin user
-- This is a placeholder - in production, this would be handled through Supabase Auth

COMMENT ON TABLE categories IS 'Content categories with slug-based hierarchy';
COMMENT ON TABLE subcategories IS 'Content subcategories linked to parent categories';
COMMENT ON TABLE subjects IS 'Learning subjects containing exams and questions';
COMMENT ON TABLE exams IS 'Practice exams within subjects';
COMMENT ON TABLE questions IS 'Individual questions within exams';
COMMENT ON TABLE user_profiles IS 'Extended user profiles linked to Supabase Auth users';
COMMENT ON TABLE exam_sessions IS 'User exam attempt sessions with progress tracking'; 