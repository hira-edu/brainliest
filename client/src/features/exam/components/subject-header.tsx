/**
 * Subject Header Component
 * Displays subject information with navigation and statistics
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

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

interface SubjectHeaderProps {
  subject: Subject;
  examCount: number;
  questionCount: number;
}

export function SubjectHeader({ subject, examCount, questionCount }: SubjectHeaderProps) {
  const [, setLocation] = useLocation();

  const handleGoBack = () => {
    setLocation('/subjects');
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
              Back to Subjects
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mt-2"></div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {subject.icon && (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: subject.color || '#6366f1' }}
                  >
                    <i className={subject.icon}></i>
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subject.name}
                </h1>
              </div>
              {subject.description && (
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                  {subject.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              {examCount} Practice Exam{examCount !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {questionCount} Total Questions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}