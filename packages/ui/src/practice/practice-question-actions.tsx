import * as React from 'react';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';

export interface PracticeQuestionActionsProps {
  isBookmarked?: boolean;
  onToggleBookmark?: (next: boolean) => void;
  bookmarkedLabel?: string;
  removeBookmarkLabel?: string;
  isFlagged?: boolean;
  onToggleFlag?: (next: boolean) => void;
  flagLabel?: string;
  unflagLabel?: string;
  timerLabel?: string;
}

export function PracticeQuestionActions({
  isBookmarked = false,
  onToggleBookmark,
  bookmarkedLabel = 'Bookmark question',
  removeBookmarkLabel = 'Remove bookmark',
  isFlagged = false,
  onToggleFlag,
  flagLabel = 'Flag question',
  unflagLabel = 'Unflag question',
  timerLabel,
}: PracticeQuestionActionsProps) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[practice] question actions state', {
      isBookmarked,
      isFlagged,
      bookmarkAriaLabel: isBookmarked ? removeBookmarkLabel : bookmarkedLabel,
      flagAriaLabel: isFlagged ? unflagLabel : flagLabel,
    });
  }, [isBookmarked, isFlagged, removeBookmarkLabel, bookmarkedLabel, unflagLabel, flagLabel]);

  const handleBookmark = () => {
    if (onToggleBookmark) {
      onToggleBookmark(!isBookmarked);
    }
  };

  const handleFlag = () => {
    if (onToggleFlag) {
      onToggleFlag(!isFlagged);
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 rounded-full"
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? removeBookmarkLabel : bookmarkedLabel}
        onClick={handleBookmark}
      >
        <Icon name={isBookmarked ? 'BookmarkCheck' : 'Bookmark'} size="sm" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 rounded-full"
        aria-pressed={isFlagged}
        aria-label={isFlagged ? unflagLabel : flagLabel}
        onClick={handleFlag}
      >
        <Icon name={isFlagged ? 'FlagOff' : 'Flag'} size="sm" />
      </Button>
      {timerLabel ? (
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          <Icon name="Clock" size="sm" aria-hidden="true" />
          <time>{timerLabel}</time>
        </span>
      ) : null}
    </div>
  );
}
