/**
 * Centralized slug-based navigation utilities
 * Provides consistent slug-based routing with ID fallback for backward compatibility
 */

import { Subject, Exam } from "@shared/schema";

export interface NavigationOptions {
  preferSlug?: boolean;
}

/**
 * Generate subject URL with slug-first approach
 */
export function getSubjectUrl(subject: Subject | { id: number; slug?: string }, options: NavigationOptions = { preferSlug: true }): string {
  if (options.preferSlug && subject.slug) {
    return `/subject/${subject.slug}`;
  }
  return `/subject/${subject.id}`;
}

/**
 * Generate exam URL with slug-first approach
 */
export function getExamUrl(exam: Exam | { id: number; slug?: string }, options: NavigationOptions = { preferSlug: true }): string {
  if (options.preferSlug && exam.slug) {
    return `/exam/${exam.slug}`;
  }
  return `/exam/${exam.id}`;
}

/**
 * Navigation helper for subject selection
 */
export function navigateToSubject(setLocation: (path: string) => void, subject: Subject | { id: number; slug?: string }) {
  const url = getSubjectUrl(subject);
  setLocation(url);
}

/**
 * Navigation helper for exam selection
 */
export function navigateToExam(setLocation: (path: string) => void, exam: Exam | { id: number; slug?: string }) {
  const url = getExamUrl(exam);
  setLocation(url);
}

/**
 * Get back navigation URL based on current context
 */
export function getBackToSubjectsUrl(): string {
  return '/subjects';
}

/**
 * Get back navigation URL for exam to subject
 */
export function getBackToSubjectUrl(subjectId: number, subjectSlug?: string): string {
  if (subjectSlug) {
    return `/subject/${subjectSlug}`;
  }
  return `/subject/${subjectId}`;
}

/**
 * Detect if current path is slug-based or ID-based
 */
export function isSlugBasedPath(path: string): boolean {
  // Check if path contains non-numeric segments after subject/exam
  const subjectMatch = path.match(/\/subject\/([^\/]+)/);
  const examMatch = path.match(/\/exam\/([^\/]+)/);
  
  if (subjectMatch) {
    return isNaN(Number(subjectMatch[1]));
  }
  
  if (examMatch) {
    return isNaN(Number(examMatch[1]));
  }
  
  return false;
}

/**
 * Extract slug or ID from current path
 */
export function extractSlugOrId(path: string, type: 'subject' | 'exam'): string | null {
  const pattern = new RegExp(`\\/${type}\\/([^\\/]+)`);
  const match = path.match(pattern);
  return match ? match[1] : null;
}