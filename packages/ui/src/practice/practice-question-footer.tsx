import * as React from 'react';
import { PracticeNavigation, type PracticeNavigationProps } from './practice-navigation';
import { cn } from '../lib/utils';

export interface PracticeQuestionFooterProps
  extends Pick<PracticeNavigationProps,
    | 'onPrevious'
    | 'onNext'
    | 'disablePrevious'
    | 'disableNext'
    | 'progressLabel'
    | 'leadingSlot'
    | 'trailingSlot'
  > {
  className?: string;
}

export function PracticeQuestionFooter({ className, ...rest }: PracticeQuestionFooterProps) {
  return (
    <div className={cn('mt-4', className)}>
      <PracticeNavigation {...rest} />
    </div>
  );
}
