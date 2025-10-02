"use client";

import { forwardRef, useMemo } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Button } from '../primitives/button';
import { cn } from '../lib/utils';

export type PaginationElement = number | 'ellipsis';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  className?: string;
}

function createRange(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => start + idx);
}

export function usePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number
): PaginationElement[] {
  return useMemo(() => {
    if (totalPages <= 0) {
      return [];
    }

    const windowSize = Math.max(1, siblingCount * 2 + 1);
    const totalNumbersToShow = boundaryCount * 2 + windowSize;

    if (totalNumbersToShow >= totalPages) {
      return createRange(1, totalPages);
    }

    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const chunkStart = Math.floor((safePage - 1) / windowSize) * windowSize + 1;
    const chunkEnd = Math.min(chunkStart + windowSize - 1, totalPages);

    const startBoundary = boundaryCount > 0 ? createRange(1, boundaryCount) : [];
    const middleRange = createRange(chunkStart, chunkEnd);
    const endBoundary =
      boundaryCount > 0
        ? createRange(Math.max(totalPages - boundaryCount + 1, 1), totalPages)
        : [];

    const numbers = [...startBoundary, ...middleRange, ...endBoundary]
      .filter((page) => page >= 1 && page <= totalPages);

    const orderedUnique = Array.from(new Set(numbers)).sort((a, b) => a - b);

    const range: PaginationElement[] = [];
    let previous: number | null = null;

    for (const page of orderedUnique) {
      if (previous !== null && page - previous > 1) {
        range.push('ellipsis');
      }
      range.push(page);
      previous = page;
    }

    return range;
  }, [currentPage, totalPages, siblingCount, boundaryCount]);
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  className,
}: PaginationProps) => {
  const pages = usePaginationRange(currentPage, totalPages, siblingCount, boundaryCount);

  if (pages.length <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'grid w-full grid-cols-[auto,1fr,auto] items-center gap-2 text-sm text-gray-600',
        className
      )}
    >
      <PaginationButton
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        className="justify-self-start flex-shrink-0"
      >
        Previous
      </PaginationButton>

      <ul className="flex list-none items-center justify-center gap-2 p-0">
        {pages.map((element, index) => {
          if (element === 'ellipsis') {
            return (
              <li
                key={`ellipsis-${index}`}
                className="inline-flex select-none px-2 text-gray-400"
                aria-hidden="true"
              >
                …
              </li>
            );
          }

          const pageNumber = element;
          const isActive = pageNumber === currentPage;

          return (
            <li key={pageNumber}>
              <PaginationButton
                aria-label={`Page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
                variant={isActive ? 'active' : 'ghost'}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </PaginationButton>
            </li>
          );
        })}
      </ul>

      <PaginationButton
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        className="justify-self-end flex-shrink-0"
      >
        Next
      </PaginationButton>
    </nav>
  );
};

interface PaginationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'active';
}

const variantClasses: Record<NonNullable<PaginationButtonProps['variant']>, string> = {
  default: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200',
  ghost: 'text-gray-600 hover:bg-gray-100 border border-transparent',
  active: 'bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100',
};

const PaginationButton = forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, variant = 'default', disabled, children, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      disabled={disabled}
      className={cn(
        'h-9 min-w-[2.25rem] rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed opacity-50' : variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
);

PaginationButton.displayName = 'PaginationButton';
