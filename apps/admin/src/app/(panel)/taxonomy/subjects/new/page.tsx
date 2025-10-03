import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { SubjectForm } from '@/components/subject-form';
import { listTaxonomyCategories } from '@/lib/taxonomy';
import { createSubjectAction } from '../../actions';

export const metadata: Metadata = {
  title: 'Create subject · Taxonomy · Brainliest Admin',
};

export default async function NewSubjectPage() {
  const categories = await listTaxonomyCategories();

  const categoryOptions = categories
    .map((category) => ({ value: category.slug, label: category.name }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const subcategoriesByCategory = Object.fromEntries(
    categories.map((category) => [
      category.slug,
      category.subcategories
        .map((subcategory) => ({ value: subcategory.slug, label: subcategory.name }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    ])
  );

  return (
    <AdminShell
      title="Create subject"
      description="Add a new subject, attach it to taxonomy, and surface discovery metadata."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subjects' },
        { label: 'Subjects', href: '/taxonomy/subjects' },
        { label: 'Create', href: '/taxonomy/subjects/new', isCurrent: true },
      ]}
    >
      <SubjectForm
        action={createSubjectAction}
        categories={categoryOptions}
        subcategoriesByCategory={subcategoriesByCategory}
        submitLabel="Create subject"
      />
    </AdminShell>
  );
}
