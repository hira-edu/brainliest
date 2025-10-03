import Link from 'next/link';
import { Badge, Button } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listQuestions, countQuestionsByStatus, countQuestionsByDifficulty } from '@/lib/questions';
import { PaginationControl } from '@/components/pagination-control';

const DESCRIPTION = 'Review question inventory, monitor publishing progress, and quickly spot content gaps.';

interface QuestionsPageProps {
  readonly searchParams?: Record<string, string | string[]>;
}

const STATUS_OPTIONS = ['all', 'published', 'draft'] as const;
const DIFFICULTY_OPTIONS = ['all', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

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

function statusBadge(status: boolean): { label: string; variant: Parameters<typeof Badge>[0]['variant'] } {
  return status
    ? { label: 'Published', variant: 'success' }
    : { label: 'Draft', variant: 'warning' };
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const statusParam = parseParam(searchParams?.status) ?? 'all';
  const difficultyParam = parseParam(searchParams?.difficulty) ?? 'all';
  const pageParam = parseParam(searchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;

  const questionsPage = await listQuestions({
    page,
    status: STATUS_OPTIONS.includes(statusParam as (typeof STATUS_OPTIONS)[number])
      ? (statusParam as 'published' | 'draft' | 'all')
      : 'all',
    difficulty: DIFFICULTY_OPTIONS.includes(difficultyParam as (typeof DIFFICULTY_OPTIONS)[number])
      ? (difficultyParam as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'all')
      : 'all',
  });

  const [publishedCount, draftCount, hardCount] = await Promise.all([
    countQuestionsByStatus('published'),
    countQuestionsByStatus('draft'),
    countQuestionsByDifficulty('HARD'),
  ]);

  const totalCount = questionsPage.pagination.totalCount;
  const tableParams = {
    status: statusParam,
    difficulty: difficultyParam,
  } as Record<string, string | undefined>;

  return (
    <AdminShell
      title="Questions"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/questions' },
        { label: 'Questions', href: '/content/questions', isCurrent: true },
      ]}
      pageActions={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/content/questions/new">Create question</Link>
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total questions" value={numberFormatter.format(totalCount)} icon="ListChecks" />
        <MetricCard label="Published" value={numberFormatter.format(publishedCount)} icon="BadgeCheck" />
        <MetricCard label="Drafts" value={numberFormatter.format(draftCount)} icon="FileText" />
        <MetricCard label="Hard difficulty" value={numberFormatter.format(hardCount)} icon="Triangle" />
      </div>

      <section className="space-y-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Question inventory</h2>
            <p className="text-sm text-gray-600">Use the status and difficulty filters to prioritise audit reviews.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const query = buildSearchParams(tableParams, { status: option, page: undefined });
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
            const query = buildSearchParams(tableParams, { difficulty: option, page: undefined });
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
          data={questionsPage.data}
          getRowKey={(question) => question.id}
          columns={[
            {
              id: 'stem',
              header: 'Question',
              cell: (question) => (
                <div className="space-y-1">
                  <div className="line-clamp-2 text-sm font-medium text-gray-900">{question.stemMarkdown}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{question.domain ?? 'No domain'}</span>
                    <span aria-hidden="true">•</span>
                    <span>{question.options.length} choices</span>
                  </div>
                </div>
              ),
            },
            {
              id: 'subject',
              header: 'Subject',
              cell: (question) => question.subjectSlug,
            },
            {
              id: 'exam',
              header: 'Exam',
              cell: (question) => question.examSlug ?? '—',
            },
            {
              id: 'difficulty',
              header: 'Difficulty',
              cell: (question) => question.difficulty,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (question) => {
                const { label, variant } = statusBadge(question.published);
                return (
                  <Badge variant={variant} className="capitalize">
                    {label}
                  </Badge>
                );
              },
            },
            {
              id: 'updated',
              header: 'Updated',
              cell: (question) => dateFormatter.format(question.updatedAt),
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {questionsPage.pagination.page} of {questionsPage.pagination.totalPages} ({numberFormatter.format(totalCount)} questions)
          </span>
          <PaginationControl page={questionsPage.pagination.page} totalPages={questionsPage.pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
