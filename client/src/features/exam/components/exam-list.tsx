/**
 * Exam List Component
 * Displays a list of exams with support for both ID-based and slug-based routing
 */

import React from 'react';
import { useLocation } from 'wouter';
import { Clock, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Exam } from "@shared/schema";

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

interface ExamListProps {
  exams: Exam[];
  subjectName: string;
  useSlugRouting?: boolean;
}

export function ExamList({ exams, subjectName, useSlugRouting = true }: ExamListProps) {
  const [, setLocation] = useLocation();

  const handleStartExam = (exam: Exam) => {
    // Use centralized slug navigation with primary slug-based routing
    const examUrl = exam.slug ? `/exam/${exam.slug}` : `/exam/${exam.id}`;
    setLocation(examUrl);
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
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Available Practice Exams
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose from {exams.length} practice exam{exams.length !== 1 ? 's' : ''} for {subjectName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {exam.title}
                </h3>
                {exam.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {exam.description}
                  </p>
                )}
              </div>
              <Badge className={getDifficultyColor(exam.difficulty)}>
                {exam.difficulty}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {exam.questionCount} questions
              </div>
              {exam.duration && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(exam.duration)}
                </div>
              )}
            </div>

            <Button
              onClick={() => handleStartExam(exam)}
              className="w-full"
              disabled={exam.isActive === false}
            >
              {exam.isActive === false ? 'Coming Soon' : 'Start Practice Exam'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}