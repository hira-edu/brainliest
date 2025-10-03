import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { CategoryForm, type CategoryFormProps } from '@/components/category-form';
import { listTaxonomyCategories } from '@/lib/taxonomy';
import { updateCategoryAction } from '../../../actions';

interface CategoryState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly fieldErrors?: Record<string, string>;
}

interface EditCategoryPageProps {
  readonly params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: EditCategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const categories: Awaited<ReturnType<typeof listTaxonomyCategories>> = await listTaxonomyCategories();
  const category = categories.find((item) => item.slug === categorySlug);
  return {
    title: category ? `Edit ${category.name} · Categories · Brainliest Admin` : 'Edit category · Brainliest Admin',
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { categorySlug } = await params;
  const categories: Awaited<ReturnType<typeof listTaxonomyCategories>> = await listTaxonomyCategories();
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) {
    notFound();
  }

  const defaultValues = {
    slug: category.slug,
    name: category.name,
    type: category.type,
    description: category.description ?? undefined,
    icon: category.icon ?? undefined,
    sortOrder:
      category.sortOrder === null || category.sortOrder === undefined
        ? ''
        : String(category.sortOrder),
    active: category.active,
  } satisfies {
    readonly slug: string;
    readonly name: string;
    readonly type: string;
    readonly description?: string;
    readonly icon?: string;
    readonly sortOrder: string;
    readonly active: boolean;
  };

  const handleAction: CategoryFormProps['action'] = async (state, formData) => {
    const typedAction = updateCategoryAction as CategoryFormProps['action'];
    const result: unknown = await typedAction(state, formData);

    if (!result || typeof result !== 'object') {
      return state;
    }

    const candidate = result as Partial<CategoryState>;
    return {
      status: candidate.status ?? state.status,
      message: candidate.message,
      fieldErrors: candidate.fieldErrors,
    } satisfies CategoryState;
  };

  return (
    <AdminShell
      title="Edit category"
      description="Modify taxonomy category details."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/categories' },
        { label: 'Categories', href: '/taxonomy/categories' },
        { label: category.name, href: `/taxonomy/categories/${category.slug}/edit`, isCurrent: true },
      ]}
    >
      <CategoryForm
        {...{
          action: handleAction,
          defaultValues,
          submitLabel: 'Save changes',
        } satisfies CategoryFormProps}
      />
    </AdminShell>
  );
}
