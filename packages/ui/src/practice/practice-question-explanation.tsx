import * as React from 'react';
import { Card } from '../layout/card';
import { cn } from '../lib/utils';

export interface PracticeQuestionExplanationProps {
  visible?: boolean;
  content?: string | null;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export function PracticeQuestionExplanation({
  visible = false,
  content,
  emptyMessage = 'No question explanation is available yet.',
  className,
}: PracticeQuestionExplanationProps) {
  if (!visible) {
    return null;
  }

  const display = content && content.trim().length > 0 ? content : undefined;

  return (
    <Card padding="md" className={cn('bg-slate-50 text-sm text-gray-700', className)}>
      {display ? <p className="whitespace-pre-line">{display}</p> : <p>{emptyMessage}</p>}
    </Card>
  );
}
