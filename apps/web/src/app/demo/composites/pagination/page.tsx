'use client';

import { useState } from 'react';
import { Pagination } from '@brainliest/ui';

export default function PaginationDemo() {
  const [page, setPage] = useState(1);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Pagination</h1>
      <p className="text-gray-600">
        Pagination keeps long result sets performant while preserving context.
      </p>

      <Pagination currentPage={page} totalPages={18} onPageChange={setPage} />
      <p className="text-sm text-gray-500">Showing page {page} of 18.</p>
    </div>
  );
}
