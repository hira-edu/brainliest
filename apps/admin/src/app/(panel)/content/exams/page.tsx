import { Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listExams, countExamsByStatus } from '@/lib/exams';
import { listTaxonomySubjects } from '@/lib/taxonomy';
import { PaginationControl } from '@/components/pagination-control';
import { ExamTemplateActions } from '@/components/exam-template-actions';
import { ExamRowActions } from '@/components/exam-row-actions';
import ExamFilters from '@/components/exam-filters';
import { ExamCreateButton } from '@/components/exam-create-button';

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const DESCRIPTION = 'Audit exam inventory, monitor publishing cadence, and spot gaps across subjects.';

interface ExamsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const STATUS_OPTIONS = ['all', 'draft', 'published', 'archived'] as const;
const DIFFICULTY_OPTIONS = ['all', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
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
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const statusParam = parseParam(resolvedSearchParams?.status) ?? 'all';
  const difficultyParam = parseParam(resolvedSearchParams?.difficulty) ?? 'all';
  const categoryParam = parseParam(resolvedSearchParams?.category);
  const subcategoryParam = parseParam(resolvedSearchParams?.subcategory);
  const subjectParam = parseParam(resolvedSearchParams?.subject);
  const examParam = parseParam(resolvedSearchParams?.exam);
  const searchParam = parseParam(resolvedSearchParams?.search) ?? '';
  const pageParam = parseParam(resolvedSearchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;
  const filters = {
    status: STATUS_OPTIONS.includes(statusParam as typeof STATUS_OPTIONS[number]) && statusParam !== 'all'
      ? (statusParam as 'draft' | 'published' | 'archived')
      : undefined,
    difficulty: DIFFICULTY_OPTIONS.includes(difficultyParam as typeof DIFFICULTY_OPTIONS[number]) && difficultyParam !== 'all'
      ? (difficultyParam as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT')
      : undefined,
    categorySlug: categoryParam ?? undefined,
    subcategorySlug: subcategoryParam ?? undefined,
    subjectSlug: subjectParam ?? undefined,
    examSlug: examParam ?? undefined,
    search: searchParam.trim().length > 0 ? searchParam.trim() : undefined,
  };

  const [{ data: exams, pagination }, subjectsList, publishedCount, draftCount, archivedCount] = await Promise.all([
    listExams({
      page,
      status: filters.status,
      difficulty: filters.difficulty,
      categorySlug: filters.categorySlug,
      subcategorySlug: filters.subcategorySlug,
      subjectSlug: filters.subjectSlug,
      examSlug: filters.examSlug,
      search: filters.search,
    }),
    listTaxonomySubjects(),
    countExamsByStatus('published'),
    countExamsByStatus('draft'),
    countExamsByStatus('archived'),
  ]);

  const subjectOptionsForForm = subjectsList
    .map((subject) => ({
      value: subject.slug,
      label: subject.name,
      description: subject.subcategoryName
        ? `${subject.categoryName} • ${subject.subcategoryName}`
        : subject.categoryName,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const totalCount = pagination.totalCount;
  const initialFilters = {
    status: statusParam,
    difficulty: difficultyParam,
    categorySlug: categoryParam ?? undefined,
    subcategorySlug: subcategoryParam ?? undefined,
    subjectSlug: subjectParam ?? undefined,
    examSlug: examParam ?? undefined,
    search: searchParam ? searchParam.trim() : undefined,
  };

  return (
    <AdminShell
      title="Exams"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/exams' },
        { label: 'Exams', href: '/content/exams', isCurrent: true },
      ]}
      pageActions={<ExamCreateButton subjects={subjectOptionsForForm} />}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total exams" value={numberFormatter.format(totalCount)} icon="BookOpen" />
        <MetricCard label="Published" value={numberFormatter.format(publishedCount)} icon="BadgeCheck" />
        <MetricCard label="Drafts" value={numberFormatter.format(draftCount)} icon="FileText" />
        <MetricCard label="Archived" value={numberFormatter.format(archivedCount)} icon="Archive" />
      </div>

      <section className="space-y-4">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Exam inventory</h2>
              <p className="text-sm text-gray-600">Filter by taxonomy, publication status, or difficulty to manage launch pipelines.</p>
            </div>
            <ExamTemplateActions className="w-full max-w-xl lg:w-auto" />
          </div>
        </header>

        <ExamFilters initialFilters={initialFilters} />

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
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (exam) => (
                <ExamRowActions exam={exam} subjects={subjectOptionsForForm} />
              ),
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
