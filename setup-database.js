import postgres from "postgres";
import fs from "fs";
import path from "path";

// Use the same connection string from your environment
const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  "postgres://postgres.ucwkpmjyfrufhnbbvfev:xsCIirc0PBX4pogD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function setupDatabase() {
  console.log("🔧 Setting up database...");

  // Create postgres client
  const sql = postgres(POSTGRES_URL);

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), "sql", "create_missing_tables.sql"),
      "utf8"
    );

    // Execute the SQL
    console.log("📝 Running database creation script...");
    await sql.unsafe(sqlContent);

    console.log("✅ Database setup completed successfully!");

    // Test the connection by querying tables
    const tables = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE tablename IN ('users', 'auth_logs', 'auth_sessions', 'anon_question_sessions', 'subjects', 'exams', 'questions')
            ORDER BY tablename
        `;

    console.log(
      "📊 Created tables:",
      tables.map((t) => t.tablename)
    );
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

setupDatabase()
  .then(() => {
    console.log("🎉 Database setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Setup failed:", error);
    process.exit(1);
  });
