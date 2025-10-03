import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Container,
  Icon,
  Section,
  Stack,
} from '@brainliest/ui';
import { fetchCatalogCategories } from '@/lib/catalog/fetch-catalog';

const typeBadges: Record<string, { label: string; variant: 'secondary' | 'info' | 'success' | 'warning' | 'danger' }> = {
  professional: { label: 'Professional', variant: 'info' },
  university: { label: 'University', variant: 'success' },
  certification: { label: 'Certification', variant: 'secondary' },
};

export default async function CatalogPage() {
  const categories = await fetchCatalogCategories();

  return (
    <main>
      <Section spacing="xl" background="gray">
        <Container maxWidth="2xl" className="space-y-12">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Catalog</p>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">Explore every learning track</h1>
            <p className="max-w-3xl text-base text-gray-600">
              Browse the full Brainliest catalog across professional certifications, university programmes, and teaching credentials.
              Each card surfaces the available exam collections so you can dive directly into the practice experiences.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            {categories.map((category) => {
              const badge = typeBadges[category.type] ?? { label: category.type, variant: 'secondary' };
              return (
                <Card key={category.slug} padding="lg" className="h-full space-y-5">
                  <Stack gap={3}>
                    <div className="flex items-center gap-3">
                      <Icon name={category.icon as Parameters<typeof Icon>[0]['name']} className="text-primary-600" />
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{category.name}</h2>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </div>
                    <p className="text-base text-gray-600">{category.description}</p>
                  </Stack>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tracks</p>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((subcategory) => (
                        <Button key={subcategory.slug} variant="secondary" size="sm" asChild>
                          <Link href={`/catalog/${category.slug}/${subcategory.slug}`}>
                            {subcategory.name}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={`/catalog/${category.slug}`}>
                        View {category.subcategories.length} track{category.subcategories.length === 1 ? '' : 's'}
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href={`/catalog/${category.slug}`}>Explore tracks</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>
    </main>
  );
}
