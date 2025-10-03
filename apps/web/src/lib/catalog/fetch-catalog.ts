import 'server-only';

import { drizzleClient, createRepositories } from '@brainliest/db';

export async function fetchCatalogCategories() {
  const repositories = createRepositories(drizzleClient);
  return repositories.taxonomy.listCategoriesWithSubcategories();
}

export async function fetchCatalogCategory(slug: string) {
  const repositories = createRepositories(drizzleClient);
  return repositories.taxonomy.getCategoryWithSubcategories(slug);
}

export async function fetchCatalogSubcategory(categorySlug: string, subcategorySlug: string) {
  const repositories = createRepositories(drizzleClient);
  return repositories.taxonomy.getSubcategoryDetail(categorySlug, subcategorySlug);
}
