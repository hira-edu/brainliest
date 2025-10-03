import Link from 'next/link';
import { Badge, Button } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listQuestions, countQuestionsByStatus, countQuestionsByDifficulty } from '@/lib/questions';
import { PaginationControl } from '@/components/pagination-control';
import QuestionFilters from '@/components/question-filters';
import { QuestionRowActions } from '@/components/question-row-actions';

const DESCRIPTION = 'Review question inventory, monitor publishing progress, and quickly spot content gaps.';

interface QuestionsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

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

function statusBadge(status: boolean): { label: string; variant: Parameters<typeof Badge>[0]['variant'] } {
  return status
    ? { label: 'Published', variant: 'success' }
    : { label: 'Draft', variant: 'warning' };
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const statusParam = parseParam(resolvedSearchParams?.status) ?? 'all';
  const difficultyParam = parseParam(resolvedSearchParams?.difficulty) ?? 'all';
  const categoryParam = parseParam(resolvedSearchParams?.category);
  const subcategoryParam = parseParam(resolvedSearchParams?.subcategory);
  const subjectParam = parseParam(resolvedSearchParams?.subject);
  const examParam = parseParam(resolvedSearchParams?.exam);
  const searchParam = parseParam(resolvedSearchParams?.search);
  const pageParam = parseParam(resolvedSearchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;

  const allowedStatus = new Set(['all', 'published', 'draft', 'unpublished']);
  const normalisedStatus = allowedStatus.has(statusParam) ? statusParam : 'all';

  const allowedDifficulty = new Set(['all', 'EASY', 'MEDIUM', 'HARD', 'EXPERT']);
  const normalisedDifficulty = allowedDifficulty.has(difficultyParam) ? difficultyParam : 'all';

  const questionsPage = await listQuestions({
    page,
    status: normalisedStatus as 'published' | 'draft' | 'unpublished' | 'all',
    difficulty: normalisedDifficulty as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'all',
    categorySlug: categoryParam ?? undefined,
    subcategorySlug: subcategoryParam ?? undefined,
    subjectSlug: subjectParam ?? undefined,
    examSlug: examParam ?? undefined,
    search: searchParam?.trim() ?? undefined,
  });

  const [publishedCount, draftCount, hardCount] = await Promise.all([
    countQuestionsByStatus('published'),
    countQuestionsByStatus('draft'),
    countQuestionsByDifficulty('HARD'),
  ]);

  const totalCount = questionsPage.pagination.totalCount;
  const initialFilters = {
    status: normalisedStatus,
    difficulty: normalisedDifficulty,
    categorySlug: categoryParam ?? undefined,
    subcategorySlug: subcategoryParam ?? undefined,
    subjectSlug: subjectParam ?? undefined,
    examSlug: examParam ?? undefined,
    search: searchParam ?? undefined,
  };

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
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Question inventory</h2>
          <p className="text-sm text-gray-600">Use taxonomy, status, and difficulty filters to prioritise audit reviews.</p>
        </header>

        <QuestionFilters initialFilters={initialFilters} />

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
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (question) => <QuestionRowActions questionId={question.id} />,
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
