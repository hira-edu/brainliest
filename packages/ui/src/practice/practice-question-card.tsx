import * as React from 'react';
import { Card } from '../layout/card';
import { Badge } from '../primitives/badge';
import type { BadgeProps } from '../primitives/badge';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeQuestionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  title?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const difficultyMap: Record<NonNullable<PracticeQuestionCardProps['difficulty']>, BadgeProps['variant']> = {
  EASY: 'success',
  MEDIUM: 'info',
  HARD: 'warning',
  EXPERT: 'error',
};

export function PracticeQuestionCard({
  label,
  title,
  difficulty,
  actions,
  children,
  className,
  ...rest
}: PracticeQuestionCardProps) {
  const difficultyVariant = difficulty ? difficultyMap[difficulty] : undefined;

  return (
    <Card padding="lg" className={cn('space-y-6 bg-white shadow-sm', className)} {...rest}>
      {(label || title || difficulty || actions) && (
        <Stack gap={2}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {label ? <p className="text-sm font-medium uppercase tracking-wide text-primary-600">{label}</p> : null}
              {difficulty && difficultyVariant ? <Badge variant={difficultyVariant}>{difficulty}</Badge> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
          {title ? <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h2> : null}
        </Stack>
      )}
      <div className="space-y-4 text-base leading-relaxed text-gray-700">{children}</div>
    </Card>
  );
}
