/**
 * Custom hook for slug-based routing
 * Provides utilities for generating, validating, and using slug-based URLs
 */

import { useCallback } from 'react';
import { useLocation } from 'wouter';

export function useSlugRouting() {
  const [location, setLocation] = useLocation();

  // Navigate to subject by slug
  const navigateToSubject = useCallback((slug: string) => {
    setLocation(`/subject/${slug}`);
  }, [setLocation]);

  // Navigate to exam by slug
  const navigateToExam = useCallback((slug: string) => {
    setLocation(`/exam/${slug}`);
  }, [setLocation]);

  // Navigate to question by slug
  const navigateToQuestion = useCallback((slug: string) => {
    setLocation(`/question/${slug}`);
  }, [setLocation]);

  // Navigate to category by slug
  const navigateToCategory = useCallback((slug: string) => {
    setLocation(`/category/${slug}`);
  }, [setLocation]);

  // Generate subject URL from object
  const getSubjectUrl = useCallback((subject: { id?: number; slug?: string; name?: string }) => {
    if (subject.slug) {
      return `/subject/${subject.slug}`;
    }
    // Fallback to ID-based URL if slug not available
    return `/subject/${subject.id}`;
  }, []);

  // Generate exam URL from object
  const getExamUrl = useCallback((exam: { id?: number; slug?: string; title?: string }) => {
    if (exam.slug) {
      return `/exam/${exam.slug}`;
    }
    // Fallback to ID-based URL if slug not available
    return `/exam/${exam.id}`;
  }, []);

  // Extract slug from current location
  const getCurrentSlug = useCallback(() => {
    const pathParts = location.split('/');
    return pathParts[pathParts.length - 1];
  }, [location]);

  // Check if current path is slug-based
  const isSlugBasedPath = useCallback(() => {
    return location.includes('/subject/') || location.includes('/exam/') || 
           location.includes('/question/') || location.includes('/category/');
  }, [location]);

  return {
    // Navigation functions
    navigateToSubject,
    navigateToExam,
    navigateToQuestion,
    navigateToCategory,
    
    // URL generation
    getSubjectUrl,
    getExamUrl,
    
    // Utilities
    getCurrentSlug,
    isSlugBasedPath,
    currentLocation: location
  };
}