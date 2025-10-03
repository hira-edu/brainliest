import * as React from 'react';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeQuestionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: React.ComponentProps<typeof Stack>['gap'];
}

export function PracticeQuestionContent({ gap = '6', className, children, ...rest }: PracticeQuestionContentProps) {
  return (
    <Stack gap={gap} className={cn(className)} {...rest}>
      {children}
    </Stack>
  );
}
