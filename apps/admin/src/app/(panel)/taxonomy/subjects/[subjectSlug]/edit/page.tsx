import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { SubjectForm, type SubjectFormProps } from '@/components/subject-form';
import { listTaxonomyCategories, listTaxonomySubjects } from '@/lib/taxonomy';
import { updateSubjectAction } from '../../../actions';

interface SubjectState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly fieldErrors?: Record<string, string>;
}

interface EditSubjectPageProps {
  readonly params: Promise<{ subjectSlug: string }>;
}

export async function generateMetadata({ params }: EditSubjectPageProps): Promise<Metadata> {
  const { subjectSlug } = await params;
  const subjects: Awaited<ReturnType<typeof listTaxonomySubjects>> = await listTaxonomySubjects();
  const subject = subjects.find((item) => item.slug === subjectSlug);
  return {
    title: subject ? `Edit ${subject.name} · Subjects · Brainliest Admin` : 'Edit subject · Brainliest Admin',
  };
}

export default async function EditSubjectPage({ params }: EditSubjectPageProps) {
  const { subjectSlug } = await params;
  const [categories, subjects]: [
    Awaited<ReturnType<typeof listTaxonomyCategories>>,
    Awaited<ReturnType<typeof listTaxonomySubjects>>
  ] = await Promise.all([listTaxonomyCategories(), listTaxonomySubjects()]);
  const subject = subjects.find((item) => item.slug === subjectSlug);
  if (!subject) {
    notFound();
  }

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

  const defaultValues = {
    slug: subject.slug,
    categorySlug: subject.categorySlug,
    subcategorySlug: subject.subcategorySlug ?? undefined,
    name: subject.name,
    description: subject.description ?? undefined,
    icon: subject.icon ?? undefined,
    difficulty: subject.difficulty ?? undefined,
    tags: subject.tags.join(', '),
    metadata: JSON.stringify(subject.metadata ?? {}, null, 2),
    active: subject.active,
  } satisfies {
    readonly slug: string;
    readonly categorySlug: string;
    readonly subcategorySlug?: string;
    readonly name: string;
    readonly description?: string;
    readonly icon?: string;
    readonly difficulty?: string;
    readonly tags: string;
    readonly metadata: string;
    readonly active: boolean;
  };

  const handleAction: SubjectFormProps['action'] = async (state, formData) => {
    const typedAction = updateSubjectAction as SubjectFormProps['action'];
    const result: unknown = await typedAction(state, formData);

    if (!result || typeof result !== 'object') {
      return state;
    }

    const candidate = result as Partial<SubjectState>;
    return {
      status: candidate.status ?? state.status,
      message: candidate.message,
      fieldErrors: candidate.fieldErrors,
    } satisfies SubjectState;
  };

  return (
    <AdminShell
      title="Edit subject"
      description="Update subject metadata and taxonomy relationships."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Taxonomy', href: '/taxonomy/subjects' },
        { label: 'Subjects', href: '/taxonomy/subjects' },
        { label: subject.name, href: `/taxonomy/subjects/${subject.slug}/edit`, isCurrent: true },
      ]}
    >
      <SubjectForm
        {...{
          action: handleAction,
          categories: categoryOptions,
          subcategoriesByCategory,
          defaultValues,
          submitLabel: 'Save changes',
        } satisfies SubjectFormProps}
      />
    </AdminShell>
  );
}
