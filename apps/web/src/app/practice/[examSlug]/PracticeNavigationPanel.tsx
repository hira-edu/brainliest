'use client';

import { useState } from 'react';
import { PracticeNavigation } from '@brainliest/ui';

interface PracticeNavigationPanelProps {
  progressLabel: string;
  timeRemainingLabel?: string;
}

export function PracticeNavigationPanel({
  progressLabel,
  timeRemainingLabel,
}: PracticeNavigationPanelProps) {
  const [isFlagged, setIsFlagged] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <PracticeNavigation
      progressLabel={progressLabel}
      disablePrevious
      isFlagged={isFlagged}
      onToggleFlag={setIsFlagged}
      isBookmarked={isBookmarked}
      onToggleBookmark={setIsBookmarked}
      rightSlot={timeRemainingLabel ? <span className="font-medium text-gray-700">{timeRemainingLabel}</span> : undefined}
    />
  );
}
