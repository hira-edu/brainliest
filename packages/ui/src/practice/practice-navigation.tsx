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
  isFlagged?: boolean;
  onToggleFlag?: (next: boolean) => void;
  flagLabel?: string;
  flaggedLabel?: string;
  isBookmarked?: boolean;
  onToggleBookmark?: (next: boolean) => void;
  bookmarkLabel?: string;
  bookmarkedLabel?: string;
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
  isFlagged,
  onToggleFlag,
  flagLabel = 'Flag question',
  flaggedLabel = 'Flagged',
  isBookmarked,
  onToggleBookmark,
  bookmarkLabel = 'Bookmark',
  bookmarkedLabel = 'Bookmarked',
  className,
  ...rest
}: PracticeNavigationProps) {
  const handleFlagClick = () => {
    if (onToggleFlag) {
      onToggleFlag(!isFlagged);
    }
  };

  const handleBookmarkClick = () => {
    if (onToggleBookmark) {
      onToggleBookmark(!isBookmarked);
    }
  };

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
      <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-3">
        {onToggleFlag ? (
          <Button
            type="button"
            variant={isFlagged ? 'secondary' : 'ghost'}
            onClick={handleFlagClick}
            aria-pressed={Boolean(isFlagged)}
          >
            {isFlagged ? flaggedLabel : flagLabel}
          </Button>
        ) : null}
        {onToggleBookmark ? (
          <Button
            type="button"
            variant={isBookmarked ? 'secondary' : 'ghost'}
            onClick={handleBookmarkClick}
            aria-pressed={Boolean(isBookmarked)}
          >
            {isBookmarked ? bookmarkedLabel : bookmarkLabel}
          </Button>
        ) : null}
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
    </Card>
  );
}
