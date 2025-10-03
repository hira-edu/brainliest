import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Icon,
  PracticeCourseNavigation,
  Section,
  Stack,
} from '@brainliest/ui';
import { fetchCatalogCategories, fetchCatalogCategory } from '@/lib/catalog/fetch-catalog';

const subcategoryIcons: Record<string, Parameters<typeof Icon>[0]['name']> = {
  aws: 'Cloud',
  'cisco-networking': 'Network',
  security: 'ShieldCheck',
  biology: 'FlaskConical',
  'computer-science': 'Cpu',
  pedagogy: 'BookOpenCheck',
};

interface CategoryPageParams {
  categorySlug: string;
}

export default async function CatalogCategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
  const { categorySlug } = await params;
  const category = await fetchCatalogCategory(categorySlug);

  if (!category) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Catalog', href: '/catalog' },
    { label: category.name, isCurrent: true },
  ];

  const sidebarItems = category.subcategories.map((subcategory) => ({
    label: subcategory.name,
    href: `/catalog/${category.slug}/${subcategory.slug}`,
    icon: <Icon name={subcategoryIcons[subcategory.slug] ?? 'FolderOpen'} aria-hidden="true" className="text-primary-500" />,
    badge: <Badge size="sm">{subcategory.examCount}</Badge>,
  }));

  const menuItems = [
    { label: 'Overview', href: '#overview', isActive: true },
    { label: 'Most popular', href: '#popular' },
    { label: 'Recently added', href: '#recent' },
    { label: 'Upcoming releases', href: '#upcoming' },
  ];

  return (
    <main>
      <Section spacing="xl">
        <Container maxWidth="2xl" className="space-y-10">
          <Breadcrumbs items={breadcrumbs} />

          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icon name={category.icon as Parameters<typeof Icon>[0]['name']} className="text-primary-600" aria-hidden="true" />
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{category.name}</h1>
                <p className="text-base text-gray-600 max-w-xl">{category.description}</p>
              </div>
            </div>
            <Badge variant="secondary">{category.subcategories.length} tracks</Badge>
          </header>

          <PracticeCourseNavigation
            courseLabel={category.name}
            collectionLabel={`${category.subcategories.length} learning track${category.subcategories.length === 1 ? '' : 's'}`}
            sidebarItems={sidebarItems}
            menuItems={menuItems}
            footerAction={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/catalog">Browse all categories</Link>
              </Button>
            }
            menuDescription="Navigate through the track menu for quick filters or jump straight to the most popular exam bundles."
          />

          <div className="space-y-8" id="overview">
            {category.subcategories.map((subcategory) => (
              <Card key={subcategory.slug} padding="lg" className="space-y-6">
                <Stack gap={3}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Icon name={subcategoryIcons[subcategory.slug] ?? 'FolderOpen'} className="text-primary-500" aria-hidden="true" />
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{subcategory.name}</h2>
                      <p className="text-base text-gray-600">{subcategory.description ?? 'Deep-dive into the latest practice sets curated for this track.'}</p>
                    </div>
                    <Badge variant="info">{subcategory.examCount} exam{subcategory.examCount === 1 ? '' : 's'}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {subcategory.focusAreas.map((focus) => (
                      <div key={focus} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        {focus}
                      </div>
                    ))}
                  </div>
                </Stack>

                <div className="flex flex-wrap gap-3" id="popular">
                  <Button asChild>
                    <Link href={`/catalog/${category.slug}/${subcategory.slug}`}>
                      View exams
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href={`/catalog/${category.slug}/${subcategory.slug}#upcoming`}>Upcoming releases</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

export async function generateStaticParams() {
  const categories = await fetchCatalogCategories();
  return categories.map((category) => ({ categorySlug: category.slug }));
}
