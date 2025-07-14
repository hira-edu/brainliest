-- Comprehensive Seed Data with User Test Scenarios (CORRECTED SCHEMA)
-- Purpose: Populate database with realistic test data for development and testing

-- Note: User accounts must be created via Supabase Auth Dashboard or API
-- This seed assumes test users exist with these IDs (replace with actual UUIDs after creating users)

-- ===============================
-- CORE CONTENT DATA
-- ===============================

-- Insert Categories
INSERT INTO categories (slug, name, description, icon, color, is_active, sort_order) VALUES
('professional-certifications', 'Professional Certifications', 'Industry-recognized certifications for career advancement', 'award', '#3B82F6', true, 1),
('university-college', 'University & College', 'Academic subjects for students and learners', 'graduation-cap', '#059669', true, 2),
('test-preparation', 'Test Preparation', 'Standardized test prep materials', 'clipboard-list', '#7C3AED', true, 3),
('technology', 'Technology', 'IT and Software Development certifications', 'cpu', '#F59E0B', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories
INSERT INTO subcategories (slug, category_slug, name, description, icon, color, is_active, sort_order) VALUES
('it-cloud-computing', 'professional-certifications', 'IT & Cloud Computing', 'Cloud platforms and infrastructure certifications', 'cloud', '#3B82F6', true, 1),
('project-management', 'professional-certifications', 'Project Management', 'Professional project management certifications', 'briefcase', '#059669', true, 2),
('cybersecurity', 'professional-certifications', 'Cybersecurity', 'Information security and cybersecurity certifications', 'shield', '#DC2626', true, 3),
('data-science', 'university-college', 'Data Science & Analytics', 'Data analysis and machine learning courses', 'bar-chart', '#7C3AED', true, 1),
('computer-science', 'university-college', 'Computer Science', 'Programming and software development fundamentals', 'code', '#059669', true, 2),
('business-studies', 'university-college', 'Business Studies', 'Business administration and management courses', 'trending-up', '#F59E0B', true, 3),
('standardized-tests', 'test-preparation', 'Standardized Tests', 'SAT, GRE, GMAT preparation materials', 'book-open', '#7C3AED', true, 1),
('language-tests', 'test-preparation', 'Language Tests', 'TOEFL, IELTS, and other language proficiency tests', 'globe', '#059669', true, 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (slug, name, description, icon, color, category_slug, subcategory_slug, exam_count, question_count, is_active) VALUES
('pmp-certification', 'PMP Certification', 'Project Management Professional certification prep', 'award', '#3B82F6', 'professional-certifications', 'project-management', 3, 150, true),
('aws-cloud-practitioner', 'AWS Cloud Practitioner', 'Amazon Web Services Cloud Practitioner certification', 'cloud', '#FF9900', 'professional-certifications', 'it-cloud-computing', 4, 200, true),
('cissp-security', 'CISSP Security', 'Certified Information Systems Security Professional', 'shield', '#DC2626', 'professional-certifications', 'cybersecurity', 2, 120, true),
('comptia-security-plus', 'CompTIA Security+', 'CompTIA Security+ certification preparation', 'shield-check', '#DC2626', 'professional-certifications', 'cybersecurity', 3, 180, true),
('python-programming', 'Python Programming', 'Complete Python programming fundamentals', 'code', '#3776AB', 'university-college', 'computer-science', 5, 250, true),
('data-structures', 'Data Structures & Algorithms', 'Computer science data structures and algorithms', 'git-branch', '#059669', 'university-college', 'computer-science', 4, 200, true),
('machine-learning', 'Machine Learning Basics', 'Introduction to machine learning concepts', 'brain', '#7C3AED', 'university-college', 'data-science', 3, 150, true),
('statistics', 'Statistics Fundamentals', 'Statistical analysis and probability theory', 'bar-chart', '#F59E0B', 'university-college', 'data-science', 3, 120, true),
('gre-preparation', 'GRE Test Preparation', 'Graduate Record Examination preparation', 'book-open', '#7C3AED', 'test-preparation', 'standardized-tests', 6, 300, true),
('toefl-preparation', 'TOEFL Preparation', 'Test of English as a Foreign Language', 'globe', '#059669', 'test-preparation', 'language-tests', 4, 200, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Exams
INSERT INTO exams (slug, subject_slug, title, description, icon, question_count, duration, difficulty, is_active) VALUES
-- PMP Certification Exams
('pmp-fundamentals', 'pmp-certification', 'PMP Fundamentals', 'Basic project management concepts and terminology', 'book', 50, 60, 'Beginner', true),
('pmp-processes', 'pmp-certification', 'PMP Process Groups', 'Project management process groups and knowledge areas', 'settings', 75, 90, 'Intermediate', true),
('pmp-practice-exam', 'pmp-certification', 'PMP Practice Exam', 'Full-length practice exam simulating real PMP test', 'clipboard-check', 180, 240, 'Advanced', true),

-- AWS Cloud Practitioner Exams
('aws-basics', 'aws-cloud-practitioner', 'AWS Cloud Basics', 'Introduction to AWS cloud computing concepts', 'cloud', 40, 45, 'Beginner', true),
('aws-services', 'aws-cloud-practitioner', 'AWS Core Services', 'Essential AWS services and their use cases', 'server', 60, 75, 'Intermediate', true),
('aws-security', 'aws-cloud-practitioner', 'AWS Security Fundamentals', 'AWS security best practices and compliance', 'lock', 45, 60, 'Intermediate', true),
('aws-practice-exam', 'aws-cloud-practitioner', 'AWS Practice Exam', 'Full-length AWS Cloud Practitioner practice test', 'award', 65, 90, 'Advanced', true),

-- Python Programming Exams
('python-syntax', 'python-programming', 'Python Syntax Basics', 'Basic Python syntax and data types', 'code', 30, 40, 'Beginner', true),
('python-functions', 'python-programming', 'Functions and Modules', 'Python functions, modules, and packages', 'package', 40, 50, 'Intermediate', true),
('python-oop', 'python-programming', 'Object-Oriented Programming', 'Classes, objects, and inheritance in Python', 'layers', 35, 45, 'Intermediate', true),
('python-advanced', 'python-programming', 'Advanced Python Concepts', 'Decorators, generators, and context managers', 'zap', 50, 60, 'Advanced', true),
('python-practice', 'python-programming', 'Python Coding Practice', 'Hands-on coding challenges and problem solving', 'terminal', 60, 90, 'Advanced', true),

-- CompTIA Security+ Exams
('security-fundamentals', 'comptia-security-plus', 'Security Fundamentals', 'Basic cybersecurity concepts and principles', 'shield', 45, 60, 'Beginner', true),
('network-security', 'comptia-security-plus', 'Network Security', 'Network security protocols and implementations', 'wifi', 55, 70, 'Intermediate', true),
('security-practice', 'comptia-security-plus', 'Security+ Practice Exam', 'CompTIA Security+ certification practice test', 'shield-check', 90, 120, 'Advanced', true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Questions (using correct schema: text, options array, correct_answer index)
INSERT INTO questions (exam_slug, subject_slug, text, options, correct_answer, explanation, difficulty, "order") VALUES
-- PMP Fundamentals Questions
('pmp-fundamentals', 'pmp-certification', 'What is the primary purpose of a project charter?', 
 ARRAY['To define project scope', 'To authorize the project', 'To list project requirements', 'To assign team members'], 
 1, 'The project charter formally authorizes the project and provides the project manager with the authority to apply organizational resources to project activities.', 
 'Beginner', 1),

('pmp-fundamentals', 'pmp-certification', 'Which process group includes the Define Scope process?', 
 ARRAY['Initiating', 'Planning', 'Executing', 'Monitoring'], 
 1, 'Define Scope is part of the Planning process group, where the project scope is progressively elaborated.', 
 'Beginner', 2),

('pmp-fundamentals', 'pmp-certification', 'What is a stakeholder in project management?', 
 ARRAY['Only the project sponsor', 'Anyone affected by the project', 'Only team members', 'Only the customer'], 
 1, 'A stakeholder is any individual, group, or organization that may affect, be affected by, or perceive itself to be affected by a decision, activity, or outcome of a project.', 
 'Beginner', 3),

-- AWS Basics Questions
('aws-basics', 'aws-cloud-practitioner', 'What does "cloud computing" mean?', 
 ARRAY['Using someone else computer', 'On-demand delivery of IT resources', 'Storing data on CDs', 'Using only local servers'], 
 1, 'Cloud computing is the on-demand delivery of IT resources over the Internet with pay-as-you-go pricing.', 
 'Beginner', 1),

('aws-basics', 'aws-cloud-practitioner', 'Which AWS service provides virtual servers?', 
 ARRAY['S3', 'EC2', 'Lambda', 'DynamoDB'], 
 1, 'Amazon EC2 (Elastic Compute Cloud) provides secure, resizable compute capacity in the cloud.', 
 'Beginner', 2),

('aws-basics', 'aws-cloud-practitioner', 'What is the AWS global infrastructure based on?', 
 ARRAY['Data centers only', 'Regions and Availability Zones', 'Single locations', 'Virtual networks'], 
 1, 'AWS global infrastructure is based on Regions and Availability Zones, providing high availability and fault tolerance.', 
 'Beginner', 3),

-- Python Syntax Questions  
('python-syntax', 'python-programming', 'Which symbol is used for comments in Python?', 
 ARRAY['//', '#', '/*', '--'], 
 1, 'In Python, the # symbol is used to create single-line comments.', 
 'Beginner', 1),

('python-syntax', 'python-programming', 'What is the correct way to define a function in Python?', 
 ARRAY['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'], 
 1, 'In Python, functions are defined using the "def" keyword followed by the function name and parentheses.', 
 'Beginner', 2),

('python-syntax', 'python-programming', 'Which data type is used to store True/False values?', 
 ARRAY['int', 'str', 'bool', 'float'], 
 2, 'Boolean (bool) data type is used to store True or False values in Python.', 
 'Beginner', 3),

-- Security+ Questions
('security-fundamentals', 'comptia-security-plus', 'What does CIA stand for in cybersecurity?', 
 ARRAY['Central Intelligence Agency', 'Confidentiality, Integrity, Availability', 'Computer Information Access', 'Cyber Intelligence Analysis'], 
 1, 'CIA in cybersecurity refers to the three core principles: Confidentiality, Integrity, and Availability.', 
 'Beginner', 1),

('security-fundamentals', 'comptia-security-plus', 'What is the purpose of encryption?', 
 ARRAY['To speed up data transfer', 'To protect data confidentiality', 'To compress files', 'To backup data'], 
 1, 'Encryption protects data confidentiality by converting readable data into an unreadable format using cryptographic algorithms.', 
 'Beginner', 2);

-- ===============================
-- USER TEST DATA
-- ===============================

-- Sample Anonymous Sessions (for freemium testing)
INSERT INTO anon_question_sessions (ip_address, questions_answered, last_reset, user_agent_hash) VALUES
('192.168.1.100', 15, NOW() - INTERVAL '2 hours', 'hash_user_1'),
('192.168.1.101', 8, NOW() - INTERVAL '1 hour', 'hash_user_2'),
('192.168.1.102', 22, NOW() - INTERVAL '30 minutes', 'hash_user_3'),
('10.0.0.1', 5, NOW() - INTERVAL '10 minutes', 'hash_user_4');

-- Sample Question Comments (using actual question IDs)
-- We'll use the first few questions that should exist after insertion
INSERT INTO question_comments (question_id, author_name, content, is_approved) VALUES
(1, 'John Doe', 'Great question! This really helped clarify the concept of project charters.', true),
(1, 'Jane Smith', 'Could you provide more examples of when a project charter is used?', true),
(2, 'Mike Johnson', 'The explanation could be more detailed about the Planning process group.', true),
(4, 'Sarah Wilson', 'This AWS question is very clear and well-explained.', true),
(5, 'David Brown', 'Perfect explanation of EC2. Very helpful for beginners.', true),
(7, 'Lisa Chen', 'Love the Python syntax examples. More please!', true),
(8, 'Tom Anderson', 'The function definition explanation is spot on.', true),
(10, 'Emma Davis', 'CIA triad explanation is excellent. Very comprehensive.', true);

-- ===============================
-- INSTRUCTIONS FOR USER CREATION
-- ===============================

-- To create test users, use the Supabase Auth dashboard or API:
-- 
-- Test User 1 (Regular User):
-- Email: student@brainliest.test
-- Password: TestPassword123!
-- Role: user
--
-- Test User 2 (Admin User):  
-- Email: admin@brainliest.test
-- Password: AdminPassword123!
-- Role: admin
--
-- Test User 3 (Moderator):
-- Email: moderator@brainliest.test  
-- Password: ModPassword123!
-- Role: moderator
--
-- After creating users, update the UUIDs below and run the user-specific inserts

-- ===============================
-- SUCCESS MESSAGE
-- ===============================

SELECT 'Database seeded successfully with comprehensive test data!' as status;
SELECT 'Categories: ' || COUNT(*) as categories FROM categories;
SELECT 'Subcategories: ' || COUNT(*) as subcategories FROM subcategories;  
SELECT 'Subjects: ' || COUNT(*) as subjects FROM subjects;
SELECT 'Exams: ' || COUNT(*) as exams FROM exams;
SELECT 'Questions: ' || COUNT(*) as questions FROM questions;
SELECT 'Comments: ' || COUNT(*) as comments FROM question_comments; 