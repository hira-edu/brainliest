/**
 * Utility functions for generating URL slugs from titles
 */

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a subject slug from subject name
 * @param subjectName - The subject name
 * @returns A URL-safe subject slug
 */
export function generateSubjectSlug(subjectName: string): string {
  return generateSlug(subjectName);
}

/**
 * Generate an exam slug from exam title
 * @param examTitle - The exam title
 * @returns A URL-safe exam slug
 */
export function generateExamSlug(examTitle: string): string {
  return generateSlug(examTitle);
}

/**
 * Generate a full exam URL path combining subject and exam slugs
 * @param subjectName - The subject name
 * @param examTitle - The exam title
 * @returns A full URL path like "/pmp/pmp-exam-help-1"
 */
export function generateExamUrl(subjectName: string, examTitle: string): string {
  const subjectSlug = generateSubjectSlug(subjectName);
  const examSlug = generateExamSlug(examTitle);
  return `/${subjectSlug}/${examSlug}`;
}

/**
 * Parse a slug-based URL to extract subject and exam information
 * @param path - The URL path like "/pmp/pmp-exam-help-1"
 * @returns Object with subject and exam slugs
 */
export function parseSlugUrl(path: string): { subjectSlug: string; examSlug: string } | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }
  return {
    subjectSlug: segments[0],
    examSlug: segments[1]
  };
}