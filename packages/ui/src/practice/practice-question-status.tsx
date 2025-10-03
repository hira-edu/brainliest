import * as React from 'react';
import { cn } from '../lib/utils';

export interface PracticeQuestionStatusProps {
  message?: React.ReactNode;
  className?: string;
}

export function PracticeQuestionStatus({ message, className }: PracticeQuestionStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn('text-sm font-medium text-gray-600', className)}>{message}</p>
  );
}
