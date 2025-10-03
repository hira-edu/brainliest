'use client';

import { PracticeNavigation } from '@brainliest/ui';

interface PracticeNavigationPanelProps {
  progressLabel: string;
  timeRemainingLabel?: string;
  disablePrevious?: boolean;
  disableNext?: boolean;
  isFlagged: boolean;
  onToggleFlag: (next: boolean) => void;
  isBookmarked: boolean;
  onToggleBookmark: (next: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function PracticeNavigationPanel({
  progressLabel,
  timeRemainingLabel,
  disablePrevious,
  disableNext,
  isFlagged,
  onToggleFlag,
  isBookmarked,
  onToggleBookmark,
  onPrevious,
  onNext,
}: PracticeNavigationPanelProps) {
  return (
    <PracticeNavigation
      progressLabel={progressLabel}
      disablePrevious={disablePrevious}
      disableNext={disableNext}
      onPrevious={onPrevious}
      onNext={onNext}
      isFlagged={isFlagged}
      onToggleFlag={onToggleFlag}
      isBookmarked={isBookmarked}
      onToggleBookmark={onToggleBookmark}
      rightSlot={timeRemainingLabel ? <span className="font-medium text-gray-700">{timeRemainingLabel}</span> : undefined}
    />
  );
}
