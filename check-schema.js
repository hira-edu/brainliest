import postgres from "postgres";

const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  "postgres://postgres.ucwkpmjyfrufhnbbvfev:xsCIirc0PBX4pogD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function checkSchema() {
  console.log("🔍 Checking database schema...");

  const sql = postgres(POSTGRES_URL);

  try {
    // Check what tables exist
    const existingTables = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `;

    console.log(
      "📊 Existing tables:",
      existingTables.map((t) => t.tablename)
    );

    // Check if core application tables exist
    const coreTableNames = [
      "categories",
      "subcategories",
      "subjects",
      "exams",
      "questions",
      "question_comments",
      "exam_sessions",
    ];
    const existingTableNames = existingTables.map((t) => t.tablename);

    const missingTables = coreTableNames.filter(
      (table) => !existingTableNames.includes(table)
    );

    if (missingTables.length > 0) {
      console.log("❌ Missing core application tables:", missingTables);

      // Create missing tables
      console.log("🔧 Creating missing tables...");

      await sql`
                -- Create categories table
                CREATE TABLE IF NOT EXISTS categories (
                    slug VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    icon VARCHAR(100),
                    color VARCHAR(7),
                    is_active BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      await sql`
                -- Create subcategories table
                CREATE TABLE IF NOT EXISTS subcategories (
                    slug VARCHAR(100) PRIMARY KEY,
                    category_slug VARCHAR(100) REFERENCES categories(slug) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    icon VARCHAR(100),
                    color VARCHAR(7),
                    is_active BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      await sql`
                -- Create subjects table
                CREATE TABLE IF NOT EXISTS subjects (
                    slug VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    icon VARCHAR(100),
                    color VARCHAR(7),
                    category_slug VARCHAR(100) REFERENCES categories(slug) ON DELETE SET NULL,
                    subcategory_slug VARCHAR(100) REFERENCES subcategories(slug) ON DELETE SET NULL,
                    exam_count INTEGER DEFAULT 0,
                    question_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      await sql`
                -- Create exams table
                CREATE TABLE IF NOT EXISTS exams (
                    slug VARCHAR(100) PRIMARY KEY,
                    subject_slug VARCHAR(100) REFERENCES subjects(slug) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    icon VARCHAR(100),
                    question_count INTEGER DEFAULT 0,
                    duration INTEGER DEFAULT 60,
                    difficulty VARCHAR(20) DEFAULT 'Beginner',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      await sql`
                -- Create questions table
                CREATE TABLE IF NOT EXISTS questions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    exam_slug VARCHAR(100) REFERENCES exams(slug) ON DELETE CASCADE,
                    subject_slug VARCHAR(100) REFERENCES subjects(slug) ON DELETE CASCADE,
                    text TEXT NOT NULL,
                    options TEXT[] NOT NULL,
                    correct_answer INTEGER NOT NULL,
                    allow_multiple_answers BOOLEAN DEFAULT FALSE,
                    explanation TEXT,
                    domain VARCHAR(100),
                    difficulty VARCHAR(20) DEFAULT 'Beginner',
                    "order" INTEGER DEFAULT 0
                )
            `;

      await sql`
                -- Create question_comments table
                CREATE TABLE IF NOT EXISTS question_comments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
                    author_name VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    is_approved BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      await sql`
                -- Create exam_sessions table
                CREATE TABLE IF NOT EXISTS exam_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    exam_slug VARCHAR(100) REFERENCES exams(slug) ON DELETE CASCADE,
                    started_at TIMESTAMPTZ DEFAULT NOW(),
                    completed_at TIMESTAMPTZ,
                    current_question INTEGER DEFAULT 0,
                    answers JSONB DEFAULT '{}'::jsonb,
                    score INTEGER,
                    is_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;

      console.log("✅ Core application tables created successfully!");
    } else {
      console.log("✅ All core application tables exist");
    }

    // Check final table list
    const finalTables = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `;

    console.log(
      "📋 Final table list:",
      finalTables.map((t) => t.tablename)
    );
  } catch (error) {
    console.error("❌ Schema check failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

checkSchema()
  .then(() => {
    console.log("🎉 Schema check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Schema check failed:", error);
    process.exit(1);
  });
