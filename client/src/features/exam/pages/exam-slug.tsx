/**
 * Exam page with slug-based routing
 * Displays exam details and questions using SEO-friendly URLs
 */

import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { SEOHead } from '../../shared';
import { ExamHeader } from '../components/exam-header';
import QuestionInterface from './question-interface';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

interface Exam {
  id: number;
  subjectId: number;
  title: string;
  description?: string;
  slug?: string;
  questionCount: number;
  duration?: number;
  difficulty: string;
  isActive?: boolean;
}

interface Subject {
  id: number;
  name: string;
  description?: string;
  slug?: string;
}

export function ExamSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch exam by slug
  const {
    data: exam,
    isLoading: examLoading,
    error: examError
  } = useQuery<Exam>({
    queryKey: ['exam-slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/exams/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Exam not found');
        }
        throw new Error('Failed to fetch exam');
      }
      return response.json();
    },
    enabled: !!slug
  });

  // Fetch subject details for breadcrumb and context
  const {
    data: subject,
    isLoading: subjectLoading
  } = useQuery<Subject>({
    queryKey: ['subject', exam?.subjectId],
    queryFn: async () => {
      const response = await fetch(`/api/subjects/${exam!.subjectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subject');
      }
      return response.json();
    },
    enabled: !!exam?.subjectId
  });

  if (examLoading || subjectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorMessage 
          message={examError?.message || 'Exam not found'} 
          action={() => window.history.back()}
          actionText="Go Back"
        />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${exam.title} | ${subject?.name || 'Practice Exam'} | Brainliest`}
        description={exam.description || `Take the ${exam.title} practice exam with ${exam.questionCount} questions.`}
        canonicalUrl={`/exam/${exam.slug}`}
        keywords={[
          exam.title,
          subject?.name || '',
          'practice exam',
          'online test',
          'certification prep',
          exam.difficulty
        ]}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Pass exam data to QuestionInterface for exam start */}
        <QuestionInterface 
          examId={exam.id} 
          examTitle={exam.title}
          subjectName={subject?.name}
          questionCount={exam.questionCount}
          duration={exam.duration}
          difficulty={exam.difficulty}
          slug={exam.slug}
        />
      </div>
    </>
  );
}