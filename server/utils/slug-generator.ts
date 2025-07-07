/**
 * Enterprise-grade slug generation utilities for SEO-friendly URLs
 */

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
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

export function generateExamSlug(examTitle: string, subjectName?: string): string {
  // Clean the exam title
  let slug = generateSlug(examTitle);
  
  // If it doesn't include the subject name, prepend it for better SEO
  if (subjectName && !slug.includes(generateSlug(subjectName))) {
    const subjectSlug = generateSlug(subjectName);
    slug = `${subjectSlug}-${slug}`;
  }
  
  return slug;
}