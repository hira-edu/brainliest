/**
 * Subject page with slug-based routing
 * Displays subject details and exams using SEO-friendly URLs
 */

import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { SEOHead } from '../../shared';
import { SubjectHeader } from '../components/subject-header';
import { ExamList } from '../components/exam-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

interface Subject {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  icon?: string;
  color?: string;
  examCount?: number;
  questionCount?: number;
}

interface Exam {
  id: number;
  title: string;
  description?: string;
  slug?: string;
  questionCount: number;
  duration?: number;
  difficulty: string;
  isActive?: boolean;
}

export function SubjectSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch subject by slug
  const {
    data: subject,
    isLoading: subjectLoading,
    error: subjectError
  } = useQuery<Subject>({
    queryKey: ['subject-slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/subjects/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Subject not found');
        }
        throw new Error('Failed to fetch subject');
      }
      return response.json();
    },
    enabled: !!slug
  });

  // Fetch exams for the subject
  const {
    data: exams,
    isLoading: examsLoading,
    error: examsError
  } = useQuery<Exam[]>({
    queryKey: ['exams', subject?.id],
    queryFn: async () => {
      const response = await fetch(`/api/exams?subjectId=${subject!.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      return response.json();
    },
    enabled: !!subject?.id
  });

  if (subjectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (subjectError || !subject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorMessage 
          message={subjectError?.message || 'Subject not found'} 
          action={() => window.history.back()}
          actionText="Go Back"
        />
      </div>
    );
  }

  const isLoading = examsLoading;
  const error = examsError;

  return (
    <>
      <SEOHead
        title={`${subject.name} Practice Exams | Brainliest`}
        description={subject.description || `Practice exams and questions for ${subject.name} certification preparation.`}
        canonicalUrl={`/subject/${subject.slug}`}
        keywords={[
          subject.name,
          'practice exam',
          'certification',
          'test preparation',
          'study guide'
        ]}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Subject Header */}
          <SubjectHeader 
            subject={subject}
            examCount={exams?.length || subject.examCount || 0}
            questionCount={subject.questionCount || 0}
          />

          {/* Content Section */}
          <div className="mt-8">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            )}

            {error && (
              <ErrorMessage 
                message="Failed to load exams" 
                action={() => window.location.reload()}
                actionText="Retry"
              />
            )}

            {exams && exams.length > 0 && (
              <ExamList 
                exams={exams}
                subjectName={subject.name}
                useSlugRouting={true}
              />
            )}

            {exams && exams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No practice exams available for this subject yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}