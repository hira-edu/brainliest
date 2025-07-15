import postgres from "postgres";
import fs from "fs";
import path from "path";

const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  "postgres://postgres.ucwkpmjyfrufhnbbvfev:xsCIirc0PBX4pogD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function runSeed() {
  console.log("🌱 Seeding database...");

  const sql = postgres(POSTGRES_URL);

  try {
    // Read the seed file
    const seedContent = fs.readFileSync(
      path.join(process.cwd(), "supabase", "seed.sql"),
      "utf8"
    );

    // Execute the seed SQL
    console.log("📝 Running seed script...");
    await sql.unsafe(seedContent);

    console.log("✅ Seed data inserted successfully!");

    // Verify the data was inserted
    const [categories, subcategories, subjects, exams, questions] =
      await Promise.all([
        sql`SELECT COUNT(*) FROM categories`,
        sql`SELECT COUNT(*) FROM subcategories`,
        sql`SELECT COUNT(*) FROM subjects`,
        sql`SELECT COUNT(*) FROM exams`,
        sql`SELECT COUNT(*) FROM questions`,
      ]);

    console.log("📊 Data verification:");
    console.log(`  Categories: ${categories[0].count}`);
    console.log(`  Subcategories: ${subcategories[0].count}`);
    console.log(`  Subjects: ${subjects[0].count}`);
    console.log(`  Exams: ${exams[0].count}`);
    console.log(`  Questions: ${questions[0].count}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runSeed()
  .then(() => {
    console.log("🎉 Database seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
