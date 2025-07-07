/**
 * Phase 1 Migration: Add slug columns to all main tables
 * This migration adds slug columns without breaking existing functionality
 */

import { db } from "../db";

export async function migrateAddSlugColumns(): Promise<void> {
  console.log("🔄 Phase 1: Adding slug columns to all tables...");
  
  try {
    // Add slug columns to categories
    await db.execute(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug 
      ON categories(slug);
    `);
    
    // Add slug columns to subcategories
    await db.execute(`
      ALTER TABLE subcategories 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_slug 
      ON subcategories(slug);
    `);
    
    // Add slug columns to subjects
    await db.execute(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_slug 
      ON subjects(slug);
    `);
    
    // Add slug columns to exams
    await db.execute(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_slug 
      ON exams(slug);
    `);
    
    // Add slug columns to questions
    await db.execute(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_slug 
      ON questions(slug);
    `);
    
    console.log("✅ Phase 1: Successfully added slug columns and indexes");
    
  } catch (error) {
    console.error("❌ Phase 1: Error adding slug columns:", error);
    throw error;
  }
}

export async function rollbackSlugColumns(): Promise<void> {
  console.log("🔄 Rolling back slug columns...");
  
  try {
    // Drop indexes first
    await db.execute(`DROP INDEX IF EXISTS idx_categories_slug;`);
    await db.execute(`DROP INDEX IF EXISTS idx_subcategories_slug;`);
    await db.execute(`DROP INDEX IF EXISTS idx_subjects_slug;`);
    await db.execute(`DROP INDEX IF EXISTS idx_exams_slug;`);
    await db.execute(`DROP INDEX IF EXISTS idx_questions_slug;`);
    
    // Drop columns
    await db.execute(`ALTER TABLE categories DROP COLUMN IF EXISTS slug;`);
    await db.execute(`ALTER TABLE subcategories DROP COLUMN IF EXISTS slug;`);
    await db.execute(`ALTER TABLE subjects DROP COLUMN IF EXISTS slug;`);
    await db.execute(`ALTER TABLE exams DROP COLUMN IF EXISTS slug;`);
    await db.execute(`ALTER TABLE questions DROP COLUMN IF EXISTS slug;`);
    
    console.log("✅ Successfully rolled back slug columns");
    
  } catch (error) {
    console.error("❌ Error rolling back slug columns:", error);
    throw error;
  }
}