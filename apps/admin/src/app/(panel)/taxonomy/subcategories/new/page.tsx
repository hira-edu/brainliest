import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { SubcategoryForm } from '@/components/subcategory-form';
import { listTaxonomyCategories } from '@/lib/taxonomy';
import { createSubcategoryAction } from '../../actions';

export const metadata: Metadata = {
  title: 'Create subcategory · Taxonomy · Brainliest Admin',
};

const toOption = (category: Awaited<ReturnType<typeof listTaxonomyCategories>>[number]) => ({
  value: category.slug,
  label: category.name,
});

export default async function NewSubcategoryPage() {
  const categories = await listTaxonomyCategories();
  const categoryOptions = categories
    .map(toOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  return (
    <AdminShell
      title="Create subcategory"
      description="Add a new track within an existing category."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subcategories' },
        { label: 'Subcategories', href: '/taxonomy/subcategories' },
        { label: 'Create', href: '/taxonomy/subcategories/new', isCurrent: true },
      ]}
    >
      <SubcategoryForm
        action={createSubcategoryAction}
        categories={categoryOptions}
        submitLabel="Create subcategory"
      />
    </AdminShell>
  );
}
