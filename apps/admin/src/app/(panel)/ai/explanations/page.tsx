import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { fetchExplanationPage } from '@/lib/explanations';
import { Button } from '@brainliest/ui';

interface ExplanationLogPageProps {
  readonly searchParams?: Promise<{
    readonly page?: string;
    readonly pageSize?: string;
  }>;
}

const DEFAULT_PAGE_SIZE = 20;

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export default async function ExplanationLogPage({ searchParams }: ExplanationLogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const pageParam = Number(resolvedSearchParams?.page);
  const pageSizeParam = Number(resolvedSearchParams?.pageSize);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : DEFAULT_PAGE_SIZE;

  const { data: explanations, pagination } = await fetchExplanationPage({
    page,
    pageSize: Math.min(pageSize, 100),
  });

  const startIndex = explanations.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const endIndex = explanations.length > 0 ? startIndex + explanations.length - 1 : 0;

  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <AdminShell
      title="AI Explanation Activity"
      description="Audit recent AI generations, monitor model usage, and verify per-question costs."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'AI & Integrations', href: '/ai/explanations' },
        { label: 'AI Explanations', href: '/ai/explanations', isCurrent: true },
      ]}
    >
      <section className="space-y-4">
        <header className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination.totalCount === 0
              ? 'No explanations captured yet.'
              : `Showing ${startIndex}–${endIndex} of ${pagination.totalCount} explanations`}
          </span>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        </header>

        <DataTable
          data={explanations}
          getRowKey={(item) => item.id}
          columns={[
            {
              id: 'generated',
              header: 'Generated',
              cell: (item) => timestampFormatter.format(item.createdAt),
            },
            {
              id: 'question',
              header: 'Question',
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{item.questionStem}</div>
                  <div className="text-xs text-gray-500">
                    {item.subjectSlug} {item.examSlug ? `• ${item.examSlug}` : ''}
                  </div>
                </div>
              ),
            },
            {
              id: 'answerHash',
              header: 'Answer Hash',
              cell: (item) => (
                <span className="font-mono text-xs text-gray-600">{item.answerPattern}</span>
              ),
            },
            {
              id: 'model',
              header: 'Model',
              cell: (item) => (
                <div className="space-y-0.5 text-gray-700">
                  <div>{item.model}</div>
                  <div className="text-xs text-gray-500">{item.language.toUpperCase()}</div>
                </div>
              ),
            },
            {
              id: 'tokens',
              header: 'Tokens',
              cell: (item) => item.tokensTotal.toLocaleString('en-US'),
              align: 'right',
            },
            {
              id: 'cost',
              header: 'Cost (¢)',
              cell: (item) => item.costCents.toLocaleString('en-US'),
              align: 'right',
            },
          ]}
          emptyState="No AI explanations captured yet."
        />

        <div className="flex items-center justify-between gap-3">
          <Button asChild variant={hasPrevious ? 'secondary' : 'ghost'} size="sm" disabled={!hasPrevious}>
            <Link
              prefetch={false}
              href={`?page=${Math.max(1, pagination.page - 1)}&pageSize=${pagination.pageSize}`}
              aria-disabled={!hasPrevious}
            >
              Previous
            </Link>
          </Button>
          <Button asChild variant={hasNext ? 'secondary' : 'ghost'} size="sm" disabled={!hasNext}>
            <Link
              prefetch={false}
              href={`?page=${hasNext ? pagination.page + 1 : pagination.page}&pageSize=${pagination.pageSize}`}
              aria-disabled={!hasNext}
            >
              Next
            </Link>
          </Button>
        </div>
      </section>
    </AdminShell>
  );
}
