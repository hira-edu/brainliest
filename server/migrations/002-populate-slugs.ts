/**
 * Phase 1 Migration: Populate slug columns for existing data
 * This migration generates and assigns slugs to all existing records
 */

import { db } from "../db";
import { categories, subcategories, subjects, exams, questions } from "../../src/shared/schemas/database";
import { generateSlugsForTable, updateRecordSlug } from "../../shared/slug-utils";

export async function populateExistingSlugs(): Promise<void> {
  console.log("🔄 Phase 1: Populating slugs for existing records...");
  
  try {
    // Populate categories
    console.log("📝 Generating slugs for categories...");
    const categoryMappings = await generateSlugsForTable('categories', 'name');
    for (const mapping of categoryMappings) {
      await updateRecordSlug('categories', mapping.id, mapping.slug);
    }
    console.log(`✅ Generated ${categoryMappings.length} category slugs`);
    
    // Populate subcategories
    console.log("📝 Generating slugs for subcategories...");
    const subcategoryMappings = await generateSlugsForTable('subcategories', 'name');
    for (const mapping of subcategoryMappings) {
      await updateRecordSlug('subcategories', mapping.id, mapping.slug);
    }
    console.log(`✅ Generated ${subcategoryMappings.length} subcategory slugs`);
    
    // Populate subjects
    console.log("📝 Generating slugs for subjects...");
    const subjectMappings = await generateSlugsForTable('subjects', 'name');
    for (const mapping of subjectMappings) {
      await updateRecordSlug('subjects', mapping.id, mapping.slug);
    }
    console.log(`✅ Generated ${subjectMappings.length} subject slugs`);
    
    // Populate exams
    console.log("📝 Generating slugs for exams...");
    const examMappings = await generateSlugsForTable('exams', 'title');
    for (const mapping of examMappings) {
      await updateRecordSlug('exams', mapping.id, mapping.slug);
    }
    console.log(`✅ Generated ${examMappings.length} exam slugs`);
    
    // Populate questions (using first 50 chars of text)
    console.log("📝 Generating slugs for questions...");
    const questionMappings = await generateSlugsForTable('questions', 'text');
    for (const mapping of questionMappings) {
      await updateRecordSlug('questions', mapping.id, mapping.slug);
    }
    console.log(`✅ Generated ${questionMappings.length} question slugs`);
    
    console.log("✅ Phase 1: Successfully populated all slugs");
    
  } catch (error) {
    console.error("❌ Phase 1: Error populating slugs:", error);
    throw error;
  }
}

export async function validateSlugPopulation(): Promise<{ valid: boolean; report: any }> {
  console.log("🔍 Validating slug population...");
  
  try {
    // Check each table for null slugs
    const categoriesWithoutSlugs = await db.execute(`
      SELECT COUNT(*) as count FROM categories WHERE slug IS NULL;
    `);
    
    const subcategoriesWithoutSlugs = await db.execute(`
      SELECT COUNT(*) as count FROM subcategories WHERE slug IS NULL;
    `);
    
    const subjectsWithoutSlugs = await db.execute(`
      SELECT COUNT(*) as count FROM subjects WHERE slug IS NULL;
    `);
    
    const examsWithoutSlugs = await db.execute(`
      SELECT COUNT(*) as count FROM exams WHERE slug IS NULL;
    `);
    
    const questionsWithoutSlugs = await db.execute(`
      SELECT COUNT(*) as count FROM questions WHERE slug IS NULL;
    `);
    
    const report = {
      categoriesWithoutSlugs: categoriesWithoutSlugs.rows[0]?.count || 0,
      subcategoriesWithoutSlugs: subcategoriesWithoutSlugs.rows[0]?.count || 0,
      subjectsWithoutSlugs: subjectsWithoutSlugs.rows[0]?.count || 0,
      examsWithoutSlugs: examsWithoutSlugs.rows[0]?.count || 0,
      questionsWithoutSlugs: questionsWithoutSlugs.rows[0]?.count || 0,
    };
    
    const totalWithoutSlugs = Object.values(report).reduce((sum: number, count: any) => sum + Number(count), 0);
    const valid = totalWithoutSlugs === 0;
    
    if (valid) {
      console.log("✅ All records have valid slugs");
    } else {
      console.log("⚠️ Some records missing slugs:", report);
    }
    
    return { valid, report };
    
  } catch (error) {
    console.error("❌ Error validating slug population:", error);
    return { valid: false, report: { error: error.message } };
  }
}