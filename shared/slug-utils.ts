import { db } from "../server/db";
import { categories, subcategories, subjects, exams, questions } from "../src/shared/schemas/database";
import { eq, like } from "drizzle-orm";

/**
 * Comprehensive slug utility for enterprise-grade URL generation
 * Supports all resource types with collision handling and validation
 */

export interface SlugOptions {
  suffix?: string;
  maxLength?: number;
  preserveCase?: boolean;
}

/**
 * Core slugify function with robust character handling
 */
export function slugify(text: string, options: SlugOptions = {}): string {
  const { suffix = '', maxLength = 200, preserveCase = false } = options;
  
  if (!text || typeof text !== 'string') {
    throw new Error('Slugify requires a valid string input');
  }

  let slug = text.trim();
  
  // Convert to lowercase unless preserveCase is true
  if (!preserveCase) {
    slug = slug.toLowerCase();
  }
  
  // Replace spaces and special characters with hyphens
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add suffix if provided
  if (suffix) {
    slug = `${slug}-${suffix}`;
  }
  
  // Truncate if too long
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-[^-]*$/, ''); // Don't cut in middle of word
  }
  
  // Ensure minimum length
  if (slug.length < 1) {
    slug = 'item';
  }
  
  return slug;
}

/**
 * Generate unique slug for categories
 */
export async function generateUniqueSlug(
  tableName: 'categories' | 'subcategories' | 'subjects' | 'exams' | 'questions',
  text: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = slugify(text);
  let finalSlug = baseSlug;
  let counter = 1;
  
  // Get the appropriate table
  const table = getTableByName(tableName);
  
  while (await isSlugTaken(table, finalSlug, excludeId)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
    
    // Prevent infinite loops
    if (counter > 1000) {
      finalSlug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return finalSlug;
}

/**
 * Check if slug is already taken
 */
async function isSlugTaken(table: any, slug: string, excludeId?: number): Promise<boolean> {
  try {
    // Build query step by step
    const baseQuery = db.select({ id: table.id }).from(table).where(eq(table.slug, slug));
    
    const result = await baseQuery.limit(1);
    
    // If updating existing record and result exists, check if it's the same record
    if (excludeId && result.length > 0) {
      return result[0].id !== excludeId;
    }
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return false;
  }
}

/**
 * Get table reference by name
 */
function getTableByName(tableName: string) {
  switch (tableName) {
    case 'categories':
      return categories;
    case 'subcategories':
      return subcategories;
    case 'subjects':
      return subjects;
    case 'exams':
      return exams;
    case 'questions':
      return questions;
    default:
      throw new Error(`Unknown table name: ${tableName}`);
  }
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!slug || typeof slug !== 'string') {
    errors.push('Slug must be a non-empty string');
    return { valid: false, errors };
  }
  
  if (slug.length < 1) {
    errors.push('Slug must be at least 1 character long');
  }
  
  if (slug.length > 255) {
    errors.push('Slug must be 255 characters or less');
  }
  
  // Check format: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  }
  
  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push('Slug cannot start or end with a hyphen');
  }
  
  // Cannot have consecutive hyphens
  if (slug.includes('--')) {
    errors.push('Slug cannot contain consecutive hyphens');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate hierarchical slug for nested resources
 */
export function generateHierarchicalSlug(parentSlug: string, childText: string): string {
  const childSlug = slugify(childText);
  return `${parentSlug}/${childSlug}`;
}

/**
 * Extract parent and child slugs from hierarchical slug
 */
export function parseHierarchicalSlug(hierarchicalSlug: string): { parent: string; child: string } {
  const parts = hierarchicalSlug.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid hierarchical slug format');
  }
  
  return {
    parent: parts[0],
    child: parts[1]
  };
}

/**
 * Bulk slug generation for migration
 */
export async function generateSlugsForTable(
  tableName: 'categories' | 'subcategories' | 'subjects' | 'exams' | 'questions',
  nameField: string = 'name'
): Promise<{ id: number; slug: string }[]> {
  const table = getTableByName(tableName);
  
  try {
    // Get all records - we'll filter for null slugs in the loop
    const records = await db.select().from(table);
    
    const slugMappings: { id: number; slug: string }[] = [];
    
    for (const record of records) {
      // Skip records that already have slugs
      if (record.slug) {
        continue;
      }
      
      let text: string;
      if (nameField === 'name' && record.name) {
        text = record.name;
      } else if (nameField === 'title' && record.title) {
        text = record.title;
      } else if (nameField === 'text' && record.text) {
        // For questions, use first 50 characters
        text = record.text.substring(0, 50);
      } else {
        text = `item-${record.id}`;
      }
      
      const uniqueSlug = await generateUniqueSlug(tableName, text, record.id);
      
      slugMappings.push({
        id: record.id,
        slug: uniqueSlug
      });
    }
    
    return slugMappings;
  } catch (error) {
    console.error(`Error generating slugs for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Update record with generated slug
 */
export async function updateRecordSlug(
  tableName: 'categories' | 'subcategories' | 'subjects' | 'exams' | 'questions',
  id: number,
  slug: string
): Promise<void> {
  const table = getTableByName(tableName);
  
  try {
    await db.update(table)
      .set({ slug })
      .where(eq(table.id, id));
  } catch (error) {
    console.error(`Error updating slug for ${tableName} ID ${id}:`, error);
    throw error;
  }
}