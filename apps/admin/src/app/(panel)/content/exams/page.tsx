import Link from 'next/link';
import { Badge, Button } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listExams, countExamsByStatus } from '@/lib/exams';
import { PaginationControl } from '@/components/pagination-control';

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const DESCRIPTION = 'Audit exam inventory, monitor publishing cadence, and spot gaps across subjects.';

interface ExamsPageProps {
  readonly searchParams?: Record<string, string | string[]>;
}

const STATUS_OPTIONS = ['all', 'draft', 'published', 'archived'] as const;
const DIFFICULTY_OPTIONS = ['all', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildSearchParams(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value && value !== 'all') {
      params.set(key, value);
    }
  }
  return params.toString();
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) {
    return '—';
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours > 0) {
    return `${hours}h${remaining > 0 ? ` ${remaining}m` : ''}`;
  }
  return `${minutes}m`;
}

function statusBadgeVariant(status: string): Parameters<typeof Badge>[0]['variant'] {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const statusParam = parseParam(searchParams?.status) ?? 'all';
  const difficultyParam = parseParam(searchParams?.difficulty) ?? 'all';
  const pageParam = parseParam(searchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;
  const filters = {
    status: STATUS_OPTIONS.includes(statusParam as typeof STATUS_OPTIONS[number]) && statusParam !== 'all'
      ? (statusParam as 'draft' | 'published' | 'archived')
      : undefined,
    difficulty: DIFFICULTY_OPTIONS.includes(difficultyParam as typeof DIFFICULTY_OPTIONS[number]) && difficultyParam !== 'all'
      ? (difficultyParam as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT')
      : undefined,
  };

  const [{ data: exams, pagination }, publishedCount, draftCount, archivedCount] = await Promise.all([
    listExams({ page, status: filters.status, difficulty: filters.difficulty }),
    countExamsByStatus('published'),
    countExamsByStatus('draft'),
    countExamsByStatus('archived'),
  ]);

  const totalCount = pagination.totalCount;
  const summaryParams = {
    status: statusParam,
    difficulty: difficultyParam,
  } as Record<string, string | undefined>;

  return (
    <AdminShell
      title="Exams"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/exams' },
        { label: 'Exams', href: '/content/exams', isCurrent: true },
      ]}
      pageActions={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/content/exams/new">Create exam</Link>
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total exams" value={numberFormatter.format(totalCount)} icon="BookOpen" />
        <MetricCard label="Published" value={numberFormatter.format(publishedCount)} icon="BadgeCheck" />
        <MetricCard label="Drafts" value={numberFormatter.format(draftCount)} icon="FileText" />
        <MetricCard label="Archived" value={numberFormatter.format(archivedCount)} icon="Archive" />
      </div>

      <section className="space-y-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Exam inventory</h2>
            <p className="text-sm text-gray-600">Filter by status or difficulty to focus on upcoming launches or clean up drafts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const query = buildSearchParams(summaryParams, { status: option, page: undefined });
              const href = query.length > 0 ? `?${query}` : '?';
              const isActive = statusParam === option;
              return (
                <Button key={option} variant={isActive ? 'primary' : 'ghost'} size="sm" asChild>
                  <Link href={href}>{option === 'all' ? 'All statuses' : option.charAt(0).toUpperCase() + option.slice(1)}</Link>
                </Button>
              );
            })}
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((option) => {
            const query = buildSearchParams(summaryParams, { difficulty: option, page: undefined });
            const href = query.length > 0 ? `?${query}` : '?';
            const isActive = difficultyParam === option;
            return (
              <Button key={option} variant={isActive ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={href}>{option === 'all' ? 'All difficulties' : option}</Link>
              </Button>
            );
          })}
        </div>

        <DataTable
          data={exams}
          getRowKey={(exam) => exam.slug}
          columns={[
            {
              id: 'title',
              header: 'Exam',
              cell: (exam) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{exam.title}</span>
                    <Badge variant="secondary">{exam.slug}</Badge>
                  </div>
                  {exam.description ? <p className="text-xs text-gray-500 line-clamp-2">{exam.description}</p> : null}
                </div>
              ),
            },
            {
              id: 'subject',
              header: 'Subject',
              cell: (exam) => (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{exam.subject?.name ?? exam.subjectSlug}</span>
                  {exam.subject?.categoryName ? (
                    <span className="text-xs text-gray-500">
                      {exam.subject.categoryName}
                      {exam.subject.categoryType ? ` • ${exam.subject.categoryType}` : ''}
                    </span>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (exam) => (
                <Badge variant={statusBadgeVariant(exam.status)} className="capitalize">
                  {exam.status.toLowerCase()}
                </Badge>
              ),
            },
            {
              id: 'difficulty',
              header: 'Difficulty',
              cell: (exam) => exam.difficulty ?? '—',
            },
            {
              id: 'duration',
              header: 'Duration',
              cell: (exam) => formatDuration(exam.durationMinutes),
            },
            {
              id: 'questionTarget',
              header: 'Questions',
              align: 'right',
              cell: (exam) => (exam.questionTarget ? numberFormatter.format(exam.questionTarget) : '—'),
            },
            {
              id: 'updated',
              header: 'Updated',
              cell: (exam) => dateFormatter.format(exam.updatedAt),
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages} ({numberFormatter.format(totalCount)} exams)
          </span>
          <PaginationControl page={pagination.page} totalPages={pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
