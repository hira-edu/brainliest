import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { SubcategoryForm, type SubcategoryFormProps } from '@/components/subcategory-form';
import { listTaxonomyCategories } from '@/lib/taxonomy';
import { updateSubcategoryAction } from '../../../actions';

interface SubcategoryState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly fieldErrors?: Record<string, string>;
}

interface EditSubcategoryPageProps {
  readonly params: Promise<{ subcategorySlug: string }>;
}

const toCategoryOption = (category: Awaited<ReturnType<typeof listTaxonomyCategories>>[number]) => ({
  value: category.slug,
  label: category.name,
});

export async function generateMetadata({ params }: EditSubcategoryPageProps): Promise<Metadata> {
  const { subcategorySlug } = await params;
  const categories: Awaited<ReturnType<typeof listTaxonomyCategories>> = await listTaxonomyCategories();
  const match = categories
    .flatMap((category) => category.subcategories.map((subcategory) => ({ category, subcategory })))
    .find((row) => row.subcategory.slug === subcategorySlug);
  return {
    title: match ? `Edit ${match.subcategory.name} · Subcategories · Brainliest Admin` : 'Edit subcategory · Brainliest Admin',
  };
}

export default async function EditSubcategoryPage({ params }: EditSubcategoryPageProps) {
  const { subcategorySlug } = await params;
  const categories: Awaited<ReturnType<typeof listTaxonomyCategories>> = await listTaxonomyCategories();
  const match = categories
    .flatMap((category) => category.subcategories.map((subcategory) => ({ category, subcategory })))
    .find((row) => row.subcategory.slug === subcategorySlug);

  if (!match) {
    notFound();
  }

  const categoryOptions = categories
    .map(toCategoryOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const defaultValues = {
    slug: match.subcategory.slug,
    categorySlug: match.category.slug,
    name: match.subcategory.name,
    description: match.subcategory.description ?? undefined,
    icon: match.subcategory.icon ?? undefined,
    sortOrder:
      match.subcategory.sortOrder === null || match.subcategory.sortOrder === undefined
        ? ''
        : String(match.subcategory.sortOrder),
    active: match.subcategory.active,
  } satisfies {
    readonly slug: string;
    readonly categorySlug: string;
    readonly name: string;
    readonly description?: string;
    readonly icon?: string;
    readonly sortOrder: string;
    readonly active: boolean;
  };

  const handleAction: SubcategoryFormProps['action'] = async (state, formData) => {
    const typedAction = updateSubcategoryAction as SubcategoryFormProps['action'];
    const result: unknown = await typedAction(state, formData);

    if (!result || typeof result !== 'object') {
      return state;
    }

    const candidate = result as Partial<SubcategoryState>;
    return {
      status: candidate.status ?? state.status,
      message: candidate.message,
      fieldErrors: candidate.fieldErrors,
    } satisfies SubcategoryState;
  };

  return (
    <AdminShell
      title="Edit subcategory"
      description="Adjust details for this track."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subcategories' },
        { label: 'Subcategories', href: '/taxonomy/subcategories' },
        { label: match.subcategory.name, href: `/taxonomy/subcategories/${match.subcategory.slug}/edit`, isCurrent: true },
      ]}
    >
      <SubcategoryForm
        {...{
          action: handleAction,
          categories: categoryOptions,
          defaultValues,
          submitLabel: 'Save changes',
        } satisfies SubcategoryFormProps}
      />
    </AdminShell>
  );
}
