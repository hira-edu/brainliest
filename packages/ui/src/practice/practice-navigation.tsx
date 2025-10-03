import * as React from 'react';
import { Button } from '../primitives/button';
import { Card } from '../layout/card';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  disablePrevious?: boolean;
  disableNext?: boolean;
  progressLabel?: string;
  rightSlot?: React.ReactNode;
}

export function PracticeNavigation({
  onPrevious,
  onNext,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  disablePrevious,
  disableNext,
  progressLabel,
  rightSlot,
  className,
  ...rest
}: PracticeNavigationProps) {
  return (
    <Card
      padding="md"
      className={cn('flex flex-col gap-4 bg-white shadow-sm sm:flex-row sm:items-center sm:justify-between', className)}
      {...rest}
    >
      <Stack gap={2} className="sm:flex sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={disablePrevious} onClick={onPrevious}>
            {previousLabel}
          </Button>
          <Button onClick={onNext} disabled={disableNext}>
            {nextLabel}
          </Button>
        </div>
        {progressLabel ? <p className="text-sm text-gray-500">{progressLabel}</p> : null}
      </Stack>
      {rightSlot ? <div className="text-sm text-gray-500">{rightSlot}</div> : null}
    </Card>
  );
}
