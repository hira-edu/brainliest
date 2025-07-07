/**
 * One-time migration script to ensure all exams have proper slugs
 * Based on the war-tested slug system guide
 */
import { db } from "./db";
import { exams } from "@shared/schema";
import { generateSlug, ensureUniqueSlug } from "./utils/slug-generator";
import { eq } from "drizzle-orm";

export async function migrateExamSlugs(): Promise<void> {
  console.log("Starting exam slug migration...");
  
  try {
    // Get all exams
    const allExams = await db.select().from(exams);
    console.log(`Found ${allExams.length} exams to process`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const exam of allExams) {
      // Check if exam already has a proper slug
      if (exam.slug && exam.slug.trim() !== '') {
        console.log(`Exam ${exam.id} already has slug: ${exam.slug}`);
        skipped++;
        continue;
      }
      
      // Generate slug from title
      const baseSlug = generateSlug(exam.title);
      
      // Get existing slugs to ensure uniqueness
      const existingSlugs = allExams
        .filter(e => e.slug && e.slug.trim() !== '')
        .map(e => e.slug);
      
      // Ensure unique slug
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
      
      // Update exam with new slug
      await db
        .update(exams)
        .set({ slug: uniqueSlug })
        .where(eq(exams.id, exam.id));
      
      console.log(`Updated exam ${exam.id}: "${exam.title}" -> slug: "${uniqueSlug}"`);
      updated++;
    }
    
    console.log(`Migration complete: ${updated} updated, ${skipped} skipped`);
  } catch (error) {
    console.error("Error during slug migration:", error);
    throw error;
  }
}

// Auto-run migration if this file is executed directly
if (require.main === module) {
  migrateExamSlugs()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}