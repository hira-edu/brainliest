import { Icon, Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listTaxonomyCategories, computeTaxonomyStats } from '@/lib/taxonomy';

const numberFormatter = new Intl.NumberFormat('en-US');

const DESCRIPTION = 'Define top-level categories, track coverage, and monitor exam availability across the catalog.';

export default async function CategoriesPage() {
  const categories = await listTaxonomyCategories();
  const stats = computeTaxonomyStats(categories);

  const subcategoryRows = categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      id: `${category.slug}:${subcategory.slug}`,
      category,
      subcategory,
    }))
  );

  return (
    <AdminShell
      title="Categories"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/categories' },
        { label: 'Categories', href: '/taxonomy/categories', isCurrent: true },
      ]}
      pageActions={
        <Badge variant="secondary">{categories.length} active categories</Badge>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Categories" value={numberFormatter.format(stats.categoryCount)} icon="FolderTree" />
        <MetricCard label="Tracks" value={numberFormatter.format(stats.trackCount)} icon="Map" />
        <MetricCard label="Subcategories" value={numberFormatter.format(stats.subcategoryCount)} icon="GitBranch" />
        <MetricCard label="Published exams" value={numberFormatter.format(stats.examCount)} icon="BookOpen" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Category overview</h2>
          <p className="text-sm text-gray-600">High-level summary of every catalog category with subcategory coverage and exam counts.</p>
        </header>

        <DataTable
          data={categories}
          getRowKey={(category) => category.slug}
          columns={[
            {
              id: 'name',
              header: 'Category',
              cell: (category) => (
                <div className="flex items-center gap-3">
                  {category.icon ? <Icon name={category.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-primary-600" aria-hidden="true" /> : null}
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {category.description ? <span className="text-xs text-gray-500">{category.description}</span> : null}
                  </div>
                </div>
              ),
            },
            {
              id: 'type',
              header: 'Type',
              cell: (category) => (
                <span className="uppercase tracking-wide text-xs text-gray-500">{category.type}</span>
              ),
            },
            {
              id: 'tracks',
              header: 'Tracks',
              align: 'right',
              cell: (category) => numberFormatter.format(category.subcategories.length),
            },
            {
              id: 'exams',
              header: 'Published exams',
              align: 'right',
              cell: (category) =>
                numberFormatter.format(
                  category.subcategories.reduce((total, subcategory) => total + subcategory.examCount, 0)
                ),
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Track coverage</h2>
          <p className="text-sm text-gray-600">
            Drill into every subcategory to audit exam availability and spotlight the focus areas surfaced from subject metadata.
          </p>
        </header>

        <DataTable
          data={subcategoryRows}
          getRowKey={(row) => row.id}
          columns={[
            {
              id: 'category',
              header: 'Category',
              cell: (row) => (
                <div className="flex items-center gap-3">
                  {row.category.icon ? <Icon name={row.category.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-primary-600" aria-hidden="true" /> : null}
                  <span className="font-medium text-gray-900">{row.category.name}</span>
                </div>
              ),
            },
            {
              id: 'track',
              header: 'Track',
              cell: (row) => (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{row.subcategory.name}</span>
                  {row.subcategory.description ? <span className="text-xs text-gray-500">{row.subcategory.description}</span> : null}
                </div>
              ),
            },
            {
              id: 'examCount',
              header: 'Exams',
              align: 'right',
              cell: (row) => numberFormatter.format(row.subcategory.examCount),
            },
            {
              id: 'focus',
              header: 'Focus areas',
              cell: (row) => (
                <div className="flex flex-wrap gap-2">
                  {row.subcategory.focusAreas.map((item) => (
                    <Badge key={item} variant="secondary" className="capitalize">
                      {item}
                    </Badge>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </section>
    </AdminShell>
  );
}
