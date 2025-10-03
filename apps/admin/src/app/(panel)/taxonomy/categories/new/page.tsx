import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { CategoryForm } from '@/components/category-form';
import { createCategoryAction } from '../../actions';

export const metadata: Metadata = {
  title: 'Create category · Taxonomy · Brainliest Admin',
};

export default function NewCategoryPage() {
  return (
    <AdminShell
      title="Create category"
      description="Add a new top-level taxonomy category."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/categories' },
        { label: 'Categories', href: '/taxonomy/categories' },
        { label: 'Create', href: '/taxonomy/categories/new', isCurrent: true },
      ]}
    >
      <CategoryForm action={createCategoryAction} submitLabel="Create category" />
    </AdminShell>
  );
}
