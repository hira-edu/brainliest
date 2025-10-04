import { Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listTaxonomyCategories, listTaxonomySubcategories } from '@/lib/taxonomy';
import type { CatalogSubcategorySummary } from '@brainliest/db';
import { SubcategoryRowActions } from '@/components/subcategory-row-actions';
import SubcategoryFilters from '@/components/subcategory-filters';
import type { SubcategoryFiltersInitialValues } from '@/types/filter-values';
import { SubcategoryCreateButton } from '@/components/subcategory-create-button';

interface SubcategoriesPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const DESCRIPTION = 'Manage subcategory mappings for each category and subject group.';

const numberFormatter = new Intl.NumberFormat('en-US');

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function SubcategoriesPage({ searchParams }: SubcategoriesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const categoryParam = parseParam(resolvedSearchParams?.category);
  const searchParam = parseParam(resolvedSearchParams?.search) ?? '';

  const [subcategories, categories] = await Promise.all([
    listTaxonomySubcategories(),
    listTaxonomyCategories(),
  ]);

  const categoryOptions = categories
    .map((category) => ({ value: category.slug, label: category.name }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const validCategorySlugs = new Set(categoryOptions.map((option) => option.value));
  const normalizedCategory = categoryParam && validCategorySlugs.has(categoryParam) ? categoryParam : undefined;

  const searchValue = searchParam.trim().toLowerCase();

  const subcategorySummaryBySlug = new Map(
    categories.flatMap((category) =>
      category.subcategories.map((summary) => [summary.slug, { categorySlug: category.slug, summary }])
    )
  );

  const filteredSubcategories = subcategories.filter((subcategory) => {
    const matchesCategory = !normalizedCategory || subcategory.categorySlug === normalizedCategory;
    const matchesSearch = searchValue.length === 0
      ? true
      : subcategory.subcategoryName.toLowerCase().includes(searchValue) ||
        subcategory.categoryName.toLowerCase().includes(searchValue) ||
        (subcategory.description ?? '').toLowerCase().includes(searchValue);
    return matchesCategory && matchesSearch;
  });

  const totalTracks = filteredSubcategories.length;
  const totalSubjects = filteredSubcategories.reduce((total, item) => total + item.subjectCount, 0);
  const totalExams = filteredSubcategories.reduce((total, item) => total + item.examCount, 0);
  const totalQuestions = filteredSubcategories.reduce((total, item) => total + item.questionCount, 0);

  const initialFilters: SubcategoryFiltersInitialValues = {
    categorySlug: normalizedCategory ?? 'all',
    search: searchValue,
  };

  return (
    <AdminShell
      title="Subcategories"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subcategories' },
        { label: 'Subcategories', href: '/taxonomy/subcategories', isCurrent: true },
      ]}
      pageActions={<SubcategoryCreateButton categories={categoryOptions} variant="secondary" />}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tracks" value={numberFormatter.format(totalTracks)} icon="GitBranch" />
        <MetricCard label="Subjects" value={numberFormatter.format(totalSubjects)} icon="GraduationCap" />
        <MetricCard label="Published exams" value={numberFormatter.format(totalExams)} icon="BookOpen" />
        <MetricCard label="Indexed questions" value={numberFormatter.format(totalQuestions)} icon="ListChecks" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Track overview</h2>
          <p className="text-sm text-gray-600">
            Review subject coverage and focus areas for each subcategory to ensure the catalog balances depth and breadth.
          </p>
        </header>

        <SubcategoryFilters initialFilters={initialFilters} categoryOptions={categoryOptions} />

        <DataTable
          data={filteredSubcategories}
          getRowKey={(subcategory) => `${subcategory.categorySlug}:${subcategory.subcategorySlug}`}
          columns={[
            {
              id: 'category',
              header: 'Category',
              cell: (subcategory) => (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{subcategory.categoryName}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-500">{subcategory.categoryType}</span>
                </div>
              ),
            },
            {
              id: 'subcategory',
              header: 'Track',
              cell: (subcategory) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{subcategory.subcategoryName}</span>
                  {subcategory.description ? (
                    <p className="text-xs text-gray-500 line-clamp-2">{subcategory.description}</p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'subjects',
              header: 'Subjects',
              align: 'right',
              cell: (subcategory) => numberFormatter.format(subcategory.subjectCount),
            },
            {
              id: 'exams',
              header: 'Published exams',
              align: 'right',
              cell: (subcategory) => numberFormatter.format(subcategory.examCount),
            },
            {
              id: 'questions',
              header: 'Indexed questions',
              align: 'right',
              cell: (subcategory) => numberFormatter.format(subcategory.questionCount),
            },
            {
              id: 'focus',
              header: 'Focus areas',
              cell: (subcategory) => (
                <div className="flex flex-wrap gap-2">
                  {subcategory.focusAreas.map((focus) => (
                    <Badge key={focus} variant="secondary" className="capitalize">
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
              cell: (subcategory) => {
                const detail = subcategorySummaryBySlug.get(subcategory.subcategorySlug);
                const parentSlug = detail?.categorySlug ?? subcategory.categorySlug;
                const summary: CatalogSubcategorySummary = detail?.summary ?? {
                  slug: subcategory.subcategorySlug,
                  name: subcategory.subcategoryName,
                  description: subcategory.description,
                  icon: subcategory.icon,
                  examCount: subcategory.examCount,
                  focusAreas: subcategory.focusAreas,
                  subjectCount: subcategory.subjectCount,
                  sortOrder: 0,
                  active: true,
                };

                return (
                  <SubcategoryRowActions
                    categorySlug={parentSlug}
                    subcategory={summary}
                    categoryOptions={categoryOptions}
                  />
                );
              },
            },
          ]}
        />
      </section>
    </AdminShell>
  );
}
