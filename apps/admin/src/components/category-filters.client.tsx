'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input, SearchableSelect, type SearchableSelectOption } from '@brainliest/ui';
import type { CategoryFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';

interface CategoryFiltersClientProps {
  readonly initialFilters: CategoryFiltersInitialValues;
  readonly availableTypes: readonly string[];
}

const formatTypeLabel = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());

const normalizeType = (value: string | undefined, options: SearchableSelectOption[]): string =>
  options.some((option) => option.value === value) ? (value as string) : 'all';

export default function CategoryFiltersClient({ initialFilters, availableTypes }: CategoryFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const typeOptions = useMemo<SearchableSelectOption[]>(() => {
    const mapped = availableTypes
      .filter((type) => Boolean(type))
      .map((type) => ({ value: type, label: formatTypeLabel(type) }));
    return [{ value: 'all', label: 'All types' }, ...mapped];
  }, [availableTypes]);

  const [filters, setFilters] = useState(() => ({
    type: normalizeType(initialFilters.type, typeOptions),
  }));
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? '');

  useEffect(() => {
    setFilters({ type: normalizeType(initialFilters.type, typeOptions) });
    setSearchInput(initialFilters.search ?? '');
  }, [initialFilters.type, initialFilters.search, typeOptions]);

  const pushFiltersToUrl = useCallback(
    (nextType: string, nextSearch: string | undefined) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      if (nextType && nextType !== 'all') {
        params.set('type', nextType);
      } else {
        params.delete('type');
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

  const updateType = useCallback(
    (value: string) => {
      setFilters({ type: value });
      startTransition(() => pushFiltersToUrl(value, searchInput));
    },
    [pushFiltersToUrl, searchInput]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => pushFiltersToUrl(filters.type, searchInput));
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters.type, pushFiltersToUrl, searchInput]);

  const handleReset = useCallback(() => {
    setFilters({ type: 'all' });
    setSearchInput('');
    startTransition(() => pushFiltersToUrl('all', ''));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.type !== 'all') total += 1;
    if (searchInput.trim().length > 0) total += 1;
    return total;
  }, [filters.type, searchInput]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Filter categories by type or keyword."
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
            placeholder="Search categories"
            aria-label="Search categories"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Type</label>
          <SearchableSelect
            options={typeOptions}
            value={filters.type}
            onChange={updateType}
            placeholder="All types"
            ariaLabel="Filter by category type"
          />
        </div>
      </div>
    </FilterPanel>
  );
}
