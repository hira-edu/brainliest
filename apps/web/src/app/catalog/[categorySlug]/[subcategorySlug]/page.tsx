import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  Button,
  PracticeExamCard,
  PracticeLayout,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
  Section,
  Stack,
} from '@brainliest/ui';
import { fetchCatalogCategories, fetchCatalogSubcategory } from '@/lib/catalog/fetch-catalog';

interface SubcategoryPageParams {
  categorySlug: string;
  subcategorySlug: string;
}

export default async function CatalogSubcategoryPage({ params }: { params: Promise<SubcategoryPageParams> }) {
  const { categorySlug, subcategorySlug } = await params;
  const detail = await fetchCatalogSubcategory(categorySlug, subcategorySlug);

  if (!detail) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Catalog', href: '/catalog' },
    { label: detail.category.name, href: `/catalog/${detail.category.slug}` },
    { label: detail.subcategory.name, isCurrent: true },
  ];

  return (
    <main>
      <Section spacing="xl">
        <PracticeLayout
          sidebar={
            <PracticeSidebar>
              <PracticeSidebarChecklistCard items={detail.subcategory.focusAreas} />
              <PracticeSidebarShortcutsCard
                shortcuts={[
                  { key: 'Shift + S', description: 'Save track to dashboard' },
                  { key: 'Shift + J', description: 'Jump between exams' },
                  { key: 'Shift + /', description: 'Open command palette' },
                ]}
              />
            </PracticeSidebar>
          }
        >
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Breadcrumbs items={breadcrumbs} className="flex-1" />
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/catalog/${detail.category.slug}`}>Back to {detail.category.name}</Link>
              </Button>
            </div>

            <header className="space-y-3">
              <Stack gap={2}>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{detail.subcategory.name}</h1>
                <p className="text-base text-gray-600 max-w-3xl">{detail.subcategory.description ?? 'Review the key themes and exams available for this track.'}</p>
              </Stack>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info">{detail.subcategory.examCount} exam{detail.subcategory.examCount === 1 ? '' : 's'}</Badge>
                <Badge variant="secondary">Category · {detail.category.name}</Badge>
              </div>
            </header>

            <div className="grid gap-6" id="upcoming">
              {detail.exams.map((exam) => (
                <PracticeExamCard
                  key={exam.slug}
                  title={exam.title}
                  subtitle={detail.subcategory.name}
                  description={exam.description}
                  tags={exam.tags}
                  stats={[
                    { label: 'Duration', value: exam.durationMinutes ? `${exam.durationMinutes} min` : '—' },
                    { label: 'Questions', value: exam.questionTarget ? String(exam.questionTarget) : '—' },
                    { label: 'Passing score', value: exam.passingScore ?? '—' },
                    { label: 'Difficulty mix', value: exam.difficultyMix ?? '—' },
                  ]}
                  actions={
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={`/practice/${exam.slug}`}>Start practice</Link>
                      </Button>
                      <Button variant="ghost" asChild>
                        <Link href={`/practice/${exam.slug}?mode=review`}>View exam overview</Link>
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        </PracticeLayout>
      </Section>
    </main>
  );
}

export async function generateStaticParams() {
  const categories = await fetchCatalogCategories();
  return categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      categorySlug: category.slug,
      subcategorySlug: subcategory.slug,
    }))
  );
}
