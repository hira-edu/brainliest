import Link from 'next/link';
import { headers } from 'next/headers';

interface ExplanationDto {
  readonly id: string;
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly answerPattern: string;
  readonly model: string;
  readonly language: string;
  readonly tokensTotal: number;
  readonly costCents: number;
  readonly createdAt: string;
  readonly subjectSlug: string;
  readonly examSlug: string | null;
  readonly questionStem: string;
}

interface PaginationDto {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

interface ExplanationResponse {
  readonly data: ExplanationDto[];
  readonly pagination: PaginationDto;
}

interface ExplanationRecord extends Omit<ExplanationDto, 'createdAt'> {
  readonly createdAt: Date;
}

interface ExplanationLogPageProps {
  readonly searchParams?: {
    readonly page?: string;
    readonly pageSize?: string;
  };
}

const DEFAULT_PAGE_SIZE = 20;

async function fetchExplanationPage(page: number, pageSize: number): Promise<{ data: ExplanationRecord[]; pagination: PaginationDto; }> {
  const headerStore = headers();
  const host = headerStore.get('host');
  const protocol = host && host.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.ADMIN_BASE_URL ?? (host ? `${protocol}://${host}` : 'http://localhost:3000');

  const response = await fetch(`${baseUrl}/api/explanations?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load explanation activity (status ${response.status})`);
  }

  const payload = (await response.json()) as ExplanationResponse;

  return {
    data: payload.data.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
    pagination: payload.pagination,
  };
}

export default async function ExplanationLogPage({ searchParams }: ExplanationLogPageProps) {
  const pageParam = Number(searchParams?.page);
  const pageSizeParam = Number(searchParams?.pageSize);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : DEFAULT_PAGE_SIZE;

  const { data: explanations, pagination } = await fetchExplanationPage(page, Math.min(pageSize, 100));

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const startIndex = explanations.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const endIndex = explanations.length > 0 ? startIndex + explanations.length - 1 : 0;

  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-8 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">AI Explanation Activity</h1>
        <p className="text-gray-600">
          Latest AI explanation generations captured from the shared service. Use this log to audit
          rate limits, model usage, and per-question activity before the analytics dashboards ship.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {pagination.totalCount === 0
              ? 'No explanations captured yet.'
              : `Showing ${startIndex}–${endIndex} of ${pagination.totalCount} explanations`}
          </span>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Generated</th>
                <th scope="col" className="px-4 py-3">Question</th>
                <th scope="col" className="px-4 py-3">Answer Hash</th>
                <th scope="col" className="px-4 py-3">Model</th>
                <th scope="col" className="px-4 py-3">Tokens</th>
                <th scope="col" className="px-4 py-3">Cost (¢)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {explanations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{formatter.format(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.questionStem}</div>
                    <div className="text-xs text-gray-500">
                      {item.subjectSlug} {item.examSlug ? `• ${item.examSlug}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.answerPattern}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{item.model}</div>
                    <div className="text-xs text-gray-500">{item.language.toUpperCase()}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.tokensTotal}</td>
                  <td className="px-4 py-3 text-gray-700">{item.costCents}</td>
                </tr>
              ))}
              {explanations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No AI explanations captured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <Link
            prefetch={false}
            href={`?page=${Math.max(1, pagination.page - 1)}&pageSize=${pagination.pageSize}`}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
              hasPrevious
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'cursor-not-allowed bg-gray-200 text-gray-500'
            }`}
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? 0 : -1}
          >
            Previous
          </Link>
          <Link
            prefetch={false}
            href={`?page=${hasNext ? pagination.page + 1 : pagination.page}&pageSize=${pagination.pageSize}`}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
              hasNext
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'cursor-not-allowed bg-gray-200 text-gray-500'
            }`}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? 0 : -1}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}
