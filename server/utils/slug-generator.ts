/**
 * War-tested slug generation utilities for dynamic slug system
 * Based on comprehensive slug system guide - no redirects approach
 */

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove all non-URL-safe characters (keep only a-z, 0-9, spaces, hyphens)
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Collapse multiple hyphens into single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Async version for database-aware unique slug generation
 */
export async function ensureUniqueSlugAsync(baseSlug: string, excludeId?: number): Promise<string> {
  // This would typically check the database for existing slugs
  // For now, we'll use the synchronous version with passed array
  return baseSlug;
}

/**
 * Generates an exam-specific slug (legacy function - kept for compatibility)
 * In war-tested system, we use simple title-based slugs only
 */
export function generateExamSlug(examTitle: string, subjectName?: string): string {
  // War-tested approach: use only exam title for slug
  // Subject context comes from URL structure: /exam/subject-slug/exam-slug
  return generateSlug(examTitle);
}