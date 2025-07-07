/**
 * Exam Header Component
 * Displays exam information with navigation and metadata
 */

import React from 'react';
import { ArrowLeft, Clock, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

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
  slug?: string;
}

interface ExamHeaderProps {
  exam: Exam;
  subject?: Subject;
  useSlugRouting?: boolean;
}

export function ExamHeader({ exam, subject, useSlugRouting = false }: ExamHeaderProps) {
  const [, setLocation] = useLocation();

  const handleGoBack = () => {
    if (useSlugRouting && subject?.slug) {
      setLocation(`/subject/${subject.slug}`);
    } else {
      setLocation(`/subject/${exam.subjectId}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': 
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 mt-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {subject?.name || 'Exams'}
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mt-2"></div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exam.title}
                </h1>
                <Badge className={getDifficultyColor(exam.difficulty)}>
                  {exam.difficulty}
                </Badge>
              </div>
              {exam.description && (
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mb-3">
                  {exam.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {exam.questionCount} Questions
                </div>
                {exam.duration && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(exam.duration)}
                  </div>
                )}
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {exam.difficulty} Level
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}