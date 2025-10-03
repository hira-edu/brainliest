'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@brainliest/ui';

export interface PaginationControlProps {
  readonly page: number;
  readonly totalPages: number;
  readonly paramKey?: string;
}

export function PaginationControl({ page, totalPages, paramKey = 'page' }: PaginationControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (nextPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (nextPage <= 1) {
        params.delete(paramKey);
      } else {
        params.set(paramKey, String(nextPage));
      }

      const query = params.toString();
      router.push(query.length > 0 ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      className={isPending ? 'opacity-60' : undefined}
    />
  );
}
