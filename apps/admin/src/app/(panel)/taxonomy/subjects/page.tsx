import { Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { getHierarchicalData, listTaxonomySubjects } from '@/lib/taxonomy';
import { SubjectRowActions } from '@/components/subject-row-actions';
import SubjectFilters from '@/components/subject-filters';
import type { SubjectFiltersInitialValues } from '@/types/filter-values';
import { SubjectCreateButton } from '@/components/subject-create-button';

interface SubjectsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const DESCRIPTION = 'Control subject metadata, difficulty, and relationships to exams.';

const numberFormatter = new Intl.NumberFormat('en-US');

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const DIFFICULTY_VALUES = new Set(['EASY', 'MEDIUM', 'HARD', 'EXPERT']);
const STATUS_VALUES = new Set(['active', 'inactive']);

export default async function SubjectsPage({ searchParams }: SubjectsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const categoryParam = parseParam(resolvedSearchParams?.category);
  const subcategoryParam = parseParam(resolvedSearchParams?.subcategory);
  const subjectParam = parseParam(resolvedSearchParams?.subject);
  const difficultyParam = (parseParam(resolvedSearchParams?.difficulty) ?? 'all').toUpperCase();
  const statusParam = (parseParam(resolvedSearchParams?.status) ?? 'all').toLowerCase();
  const searchParam = parseParam(resolvedSearchParams?.search) ?? '';

  const [subjects, hierarchy] = await Promise.all([
    listTaxonomySubjects(),
    getHierarchicalData(),
  ]);

  const categoryOptionsForForms = hierarchy.categories.map((category) => ({
    value: category.value,
    label: category.label,
    description: category.description,
  }));

  const subcategoriesByCategoryForForms = Object.fromEntries(
    Object.entries(hierarchy.subcategoriesByCategory).map(([categorySlug, options]) => [
      categorySlug,
      options.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
      })),
    ])
  );

  const validCategorySlugs = new Set(subjects.map((subject) => subject.categorySlug));
  const validSubcategorySlugs = new Set(subjects.map((subject) => subject.subcategorySlug).filter((value): value is string => Boolean(value)));
  const validSubjectSlugs = new Set(subjects.map((subject) => subject.slug));

  const normalizedCategory = categoryParam && validCategorySlugs.has(categoryParam) ? categoryParam : undefined;
  const normalizedSubcategory = subcategoryParam && validSubcategorySlugs.has(subcategoryParam) ? subcategoryParam : undefined;
  const normalizedSubject = subjectParam && validSubjectSlugs.has(subjectParam) ? subjectParam : undefined;
  const normalizedDifficulty = DIFFICULTY_VALUES.has(difficultyParam) ? difficultyParam : 'all';
  const normalizedStatus = STATUS_VALUES.has(statusParam) ? statusParam : 'all';
  const searchValue = searchParam.trim().toLowerCase();

  const filteredSubjects = subjects.filter((subject) => {
    const matchesCategory = !normalizedCategory || subject.categorySlug === normalizedCategory;
    const matchesSubcategory = !normalizedSubcategory || subject.subcategorySlug === normalizedSubcategory;
    const matchesSubject = !normalizedSubject || subject.slug === normalizedSubject;
    const matchesDifficulty = normalizedDifficulty === 'all' || subject.difficulty === normalizedDifficulty;
    const matchesStatus = normalizedStatus === 'all' || (normalizedStatus === 'active' ? subject.active : !subject.active);
    const matchesSearch = searchValue.length === 0
      ? true
      : subject.name.toLowerCase().includes(searchValue) ||
        (subject.description ?? '').toLowerCase().includes(searchValue) ||
        subject.focusAreas.some((focus) => focus.toLowerCase().includes(searchValue));

    return (
      matchesCategory &&
      matchesSubcategory &&
      matchesSubject &&
      matchesDifficulty &&
      matchesStatus &&
      matchesSearch
    );
  });

  const totalSubjects = filteredSubjects.length;
  const activeSubjects = filteredSubjects.filter((subject) => subject.active).length;
  const inactiveSubjects = totalSubjects - activeSubjects;
  const totalExams = filteredSubjects.reduce((total, subject) => total + subject.examCount, 0);
  const totalQuestions = filteredSubjects.reduce((total, subject) => total + subject.questionCount, 0);

  const initialFilters: SubjectFiltersInitialValues = {
    categorySlug: normalizedCategory,
    subcategorySlug: normalizedSubcategory,
    subjectSlug: normalizedSubject,
    difficulty: normalizedDifficulty,
    status: normalizedStatus,
    search: searchValue,
  };

  return (
    <AdminShell
      title="Subjects"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subjects' },
        { label: 'Subjects', href: '/taxonomy/subjects', isCurrent: true },
      ]}
      pageActions={
        <SubjectCreateButton
          categories={categoryOptionsForForms}
          subcategoriesByCategory={subcategoriesByCategoryForForms}
        />
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Subjects" value={numberFormatter.format(totalSubjects)} icon="GraduationCap" />
        <MetricCard label="Active" value={numberFormatter.format(activeSubjects)} icon="CircleCheck" />
        <MetricCard label="Inactive" value={numberFormatter.format(inactiveSubjects)} icon="CircleSlash2" />
        <MetricCard label="Published exams" value={numberFormatter.format(totalExams)} icon="BookOpen" />
        <MetricCard label="Indexed questions" value={numberFormatter.format(totalQuestions)} icon="ListChecks" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Subject coverage</h2>
          <p className="text-sm text-gray-600">
            Assess activity status, question depth, and associated focus areas to keep curriculum development aligned with demand.
          </p>
        </header>

        <SubjectFilters initialFilters={initialFilters} />

        <DataTable
          data={filteredSubjects}
          getRowKey={(subject) => subject.slug}
          columns={[
            {
              id: 'subject',
              header: 'Subject',
              cell: (subject) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{subject.name}</span>
                  {subject.description ? <p className="text-xs text-gray-500 line-clamp-2">{subject.description}</p> : null}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{subject.slug}</span>
                    {subject.difficulty ? (
                      <span className="uppercase tracking-wide">{subject.difficulty}</span>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              id: 'category',
              header: 'Category',
              cell: (subject) => (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{subject.categoryName}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-500">{subject.categoryType}</span>
                </div>
              ),
            },
            {
              id: 'track',
              header: 'Track',
              cell: (subject) => subject.subcategoryName ?? '—',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (subject) => (
                <Badge variant={subject.active ? 'success' : 'secondary'} className="capitalize">
                  {subject.active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              id: 'exams',
              header: 'Published exams',
              align: 'right',
              cell: (subject) => numberFormatter.format(subject.examCount),
            },
            {
              id: 'questions',
              header: 'Indexed questions',
              align: 'right',
              cell: (subject) => numberFormatter.format(subject.questionCount),
            },
            {
              id: 'focus',
              header: 'Focus areas',
              cell: (subject) => (
                <div className="flex flex-wrap gap-2">
                  {subject.focusAreas.map((focus) => (
                    <Badge key={`${subject.slug}-${focus}`} variant="secondary" className="capitalize">
                      {focus}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (subject) => (
                <SubjectRowActions
                  subject={subject}
                  categories={categoryOptionsForForms}
                  subcategoriesByCategory={subcategoriesByCategoryForForms}
                />
              ),
            },
          ]}
        />
      </section>
    </AdminShell>
  );
}
