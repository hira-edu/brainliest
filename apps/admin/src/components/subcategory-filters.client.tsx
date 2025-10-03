'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input, SearchableSelect, type SearchableSelectOption } from '@brainliest/ui';
import type { SubcategoryFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';

export interface SubcategoryFilterOption {
  readonly value: string;
  readonly label: string;
}

const normalizeCategory = (value: string | undefined, options: SearchableSelectOption[]): string =>
  options.some((option) => option.value === value) ? (value as string) : 'all';

interface SubcategoryFiltersClientProps {
  readonly initialFilters: SubcategoryFiltersInitialValues;
  readonly categoryOptions: readonly SubcategoryFilterOption[];
}

export default function SubcategoryFiltersClient({ initialFilters, categoryOptions }: SubcategoryFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectOptions = useMemo<SearchableSelectOption[]>(() => {
    const mapped = categoryOptions.map((option) => ({ value: option.value, label: option.label }));
    return [{ value: 'all', label: 'All categories' }, ...mapped];
  }, [categoryOptions]);

  const [filters, setFilters] = useState(() => ({
    categorySlug: normalizeCategory(initialFilters.categorySlug, selectOptions),
  }));
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? '');

  useEffect(() => {
    setFilters({ categorySlug: normalizeCategory(initialFilters.categorySlug, selectOptions) });
    setSearchInput(initialFilters.search ?? '');
  }, [initialFilters.categorySlug, initialFilters.search, selectOptions]);

  const pushFiltersToUrl = useCallback(
    (nextCategory: string, nextSearch: string | undefined) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      if (nextCategory && nextCategory !== 'all') {
        params.set('category', nextCategory);
      } else {
        params.delete('category');
      }

      const trimmedSearch = nextSearch?.trim() ?? '';
      if (trimmedSearch.length > 0) {
        params.set('search', trimmedSearch);
      } else {
        params.delete('search');
      }

      params.delete('page');
      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateCategory = useCallback(
    (value: string) => {
      setFilters({ categorySlug: value });
      startTransition(() => pushFiltersToUrl(value, searchInput));
    },
    [pushFiltersToUrl, searchInput]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => pushFiltersToUrl(filters.categorySlug, searchInput));
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters.categorySlug, pushFiltersToUrl, searchInput]);

  const handleReset = useCallback(() => {
    setFilters({ categorySlug: 'all' });
    setSearchInput('');
    startTransition(() => pushFiltersToUrl('all', ''));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.categorySlug !== 'all') total += 1;
    if (searchInput.trim().length > 0) total += 1;
    return total;
  }, [filters.categorySlug, searchInput]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Filter tracks by parent category or keyword."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Search subcategories"
            aria-label="Search subcategories"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Category</label>
          <SearchableSelect
            options={selectOptions}
            value={filters.categorySlug}
            onChange={updateCategory}
            placeholder="All categories"
            ariaLabel="Filter by category"
          />
        </div>
      </div>
    </FilterPanel>
  );
}
