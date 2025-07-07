/**
 * Centralized slug-based navigation utilities
 * Provides consistent slug-based routing - pure slug navigation only
 */

import { Subject, Exam } from "@shared/schema";

export interface NavigationOptions {
  preferSlug?: boolean;
}

/**
 * Generate subject URL - pure slug-based routing only
 */
export function getSubjectUrl(subject: Subject | { id: number; slug?: string }, options: NavigationOptions = { preferSlug: true }): string {
  if (subject.slug) {
    return `/subject/${subject.slug}`;
  }
  // Pure slug-based routing - no ID fallback
  console.error('Subject missing slug, redirecting to subjects page:', subject);
  return '/subjects';
}

/**
 * Generate exam URL - pure slug-based routing only
 */
export function getExamUrl(exam: Exam | { id: number; slug?: string }, options: NavigationOptions = { preferSlug: true }): string {
  if (exam.slug) {
    return `/exam/${exam.slug}`;
  }
  // Pure slug-based routing - no ID fallback
  console.error('Exam missing slug, redirecting to subjects page:', exam);
  return '/subjects';
}

/**
 * Generate hierarchical subject exam URL - deep linking support
 */
export function getHierarchicalExamUrl(subjectSlug: string, examSlug: string): string {
  if (!subjectSlug || !examSlug) {
    console.error('Missing slugs for hierarchical exam URL:', { subjectSlug, examSlug });
    return '/subjects';
  }
  return `/subject/${subjectSlug}/exam/${examSlug}`;
}

/**
 * Generate hierarchical question URL - deep linking support
 */
export function getHierarchicalQuestionUrl(subjectSlug: string, examSlug: string, questionId: string): string {
  if (!subjectSlug || !examSlug || !questionId) {
    console.error('Missing parameters for hierarchical question URL:', { subjectSlug, examSlug, questionId });
    return '/subjects';
  }
  return `/subject/${subjectSlug}/exam/${examSlug}/question/${questionId}`;
}

/**
 * Generate hierarchical results URL - deep linking support
 */
export function getHierarchicalResultsUrl(subjectSlug: string, examSlug: string, sessionId: string): string {
  if (!subjectSlug || !examSlug || !sessionId) {
    console.error('Missing parameters for hierarchical results URL:', { subjectSlug, examSlug, sessionId });
    return '/subjects';
  }
  return `/subject/${subjectSlug}/exam/${examSlug}/results/${sessionId}`;
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
 * Get back navigation URL for exam to subject - pure slug-based routing only
 */
export function getBackToSubjectUrl(subjectId: number, subjectSlug?: string): string {
  if (subjectSlug) {
    return `/subject/${subjectSlug}`;
  }
  // Pure slug-based routing - no ID fallback
  console.error('Subject slug missing for back navigation, redirecting to subjects page');
  return '/subjects';
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