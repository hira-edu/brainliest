# 📊 CSV Import Instructions for Supabase

## 🚀 How to Import CSV Files to Your Supabase Database

### Step 1: Access Supabase Table Editor
1. Go to: https://supabase.com/dashboard/project/myktgovdbllukbthjtjv
2. Click **"Table Editor"** in the left sidebar

### Step 2: Import CSV Files in Order
**⚠️ IMPORTANT: Import in this exact order to avoid foreign key errors**

#### 1. **Categories Table**
- Click **"Create a new table"** or **"Import data"**
- Choose **"Upload CSV"**
- Select: `01_categories.csv`
- Table name: `categories`
- Enable **"First row is header"**
- Click **"Import"**

#### 2. **Subcategories Table**
- Repeat process with: `02_subcategories.csv`
- Table name: `subcategories`

#### 3. **Subjects Table**
- Repeat process with: `03_subjects.csv`
- Table name: `subjects`

#### 4. **Exams Table**
- Repeat process with: `04_exams.csv`
- Table name: `exams`

#### 5. **Questions Table**
- Repeat process with: `05_questions.csv`
- Table name: `questions`

### Step 3: Create Empty Tables for Authentication
You'll also need these tables (create them empty):

#### **Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    profile_image TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    ban_reason TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    login_count INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip TEXT,
    registration_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);
```

#### **Auth Sessions Table**
```sql
CREATE TABLE auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### **Auth Logs Table**
```sql
CREATE TABLE auth_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    email TEXT,
    action TEXT NOT NULL,
    method TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### **Anonymous Question Sessions Table**
```sql
CREATE TABLE anon_question_sessions (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_agent_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### **Question Comments Table**
```sql
CREATE TABLE question_comments (
    id SERIAL PRIMARY KEY,
    question_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Step 4: Test Your Import
1. Go to **Table Editor** and verify all tables are created
2. Check that data appears correctly in each table
3. Verify relationships between tables work

### Step 5: Redeploy Vercel
After importing all data:
```bash
vercel --prod
```

## ✅ What This Gives You:
- **4 Categories** (Professional, Academic, Programming, Language)
- **5 Subcategories** (Cybersecurity, Cloud, Project Management, etc.)
- **5 Subjects** (CompTIA Security+, CISSP, AWS, PMP, Cisco CCNA)
- **4 Exams** with real exam content
- **3 Sample Questions** for Security Fundamentals
- **Complete authentication system** tables

## 🎯 Next Steps:
1. **Add more questions** by uploading additional CSV files
2. **Customize subjects** to match your needs
3. **Add more exam categories** as needed
4. **Test the live application** after deployment

Your Brainliest platform will be fully functional with real exam content! 🚀 