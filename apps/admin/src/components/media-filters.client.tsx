'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Input,
  SearchableSelect,
  type SearchableSelectOption,
  Stack,
} from '@brainliest/ui';
import type { MediaFiltersInitialValues } from '@/types/filter-values';
import type { HierarchicalTaxonomyData, HierarchyOption } from '@/types/taxonomy';
import { FilterPanel } from './filter-panel';
import { hierarchyOptionToSelect, useTaxonomySelection } from './use-taxonomy-selection';

interface MediaFiltersClientProps {
  readonly hierarchy: HierarchicalTaxonomyData;
  readonly initialFilters: MediaFiltersInitialValues;
  readonly initialExamOptions: ReadonlyArray<HierarchyOption>;
}

interface FilterState {
  type: string;
  categorySlug?: string;
  subcategorySlug?: string;
  subjectSlug?: string;
  examSlug?: string;
  search?: string;
}

const TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All assets' },
  { value: 'image', label: 'Images' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'Files' },
];

export default function MediaFiltersClient({ hierarchy, initialFilters, initialExamOptions }: MediaFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialState: FilterState = {
    type: initialFilters.type && TYPE_OPTIONS.some((option) => option.value === initialFilters.type)
      ? initialFilters.type
      : 'all',
    categorySlug: initialFilters.categorySlug,
    subcategorySlug: initialFilters.subcategorySlug,
    subjectSlug: initialFilters.subjectSlug,
    examSlug: initialFilters.examSlug,
    search: initialFilters.search?.trim() ? initialFilters.search.trim() : undefined,
  };

  const [filters, setFilters] = useState<FilterState>(initialState);
  const [searchInput, setSearchInput] = useState(initialState.search ?? '');
  const isFirstRenderRef = useRef(true);

  const {
    categoryOptions: categoryHierarchyOptions,
    subcategoryOptions: subcategoryHierarchyOptions,
    subjectOptions: subjectHierarchyOptions,
    examOptions: examHierarchyOptions,
    isFetchingExams,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSubjectChange,
    handleExamChange,
    resetSelection,
  } = useTaxonomySelection({
    hierarchy,
    filters,
    setFilters,
    initialExamOptions,
  });

  const categoryOptions = useMemo(
    () => categoryHierarchyOptions.map(hierarchyOptionToSelect),
    [categoryHierarchyOptions]
  );

  const subcategoryOptions = useMemo(
    () => subcategoryHierarchyOptions.map(hierarchyOptionToSelect),
    [subcategoryHierarchyOptions]
  );

  const subjectOptions = useMemo(
    () => subjectHierarchyOptions.map(hierarchyOptionToSelect),
    [subjectHierarchyOptions]
  );

  const mappedExamOptions = useMemo(
    () => examHierarchyOptions.map(hierarchyOptionToSelect),
    [examHierarchyOptions]
  );

  const pushFiltersToUrl = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string | undefined) => {
        if (value && value.length > 0 && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('type', next.type);
      setParam('category', next.categorySlug);
      setParam('subcategory', next.subcategorySlug);
      setParam('subject', next.subjectSlug);
      setParam('exam', next.examSlug);
      setParam('search', next.search);
      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((previous) => ({ ...previous, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput('');
    resetSelection();
    updateFilters({
      type: 'all',
      search: undefined,
    });
  }, [resetSelection, updateFilters]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    startTransition(() => pushFiltersToUrl(filters));
  }, [filters, pushFiltersToUrl]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timeout = setTimeout(() => {
      updateFilters({ search: trimmed.length > 0 ? trimmed : undefined });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, updateFilters]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.type && filters.type !== 'all') total += 1;
    if (filters.categorySlug) total += 1;
    if (filters.subcategorySlug) total += 1;
    if (filters.subjectSlug) total += 1;
    if (filters.examSlug) total += 1;
    if (filters.search) total += 1;
    return total;
  }, [filters]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Quickly locate media assets by type, taxonomy, or keyword."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Asset type</label>
          <SearchableSelect
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(value) => updateFilters({ type: value })}
            placeholder="All assets"
            ariaLabel="Select asset type"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Category</label>
          <SearchableSelect
            options={categoryOptions}
            value={filters.categorySlug}
            onChange={handleCategoryChange}
            placeholder="All categories"
            ariaLabel="Select category"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subcategory</label>
          <SearchableSelect
            options={subcategoryOptions}
            value={filters.subcategorySlug}
            onChange={handleSubcategoryChange}
            placeholder={filters.categorySlug ? 'All subcategories' : 'Select a category first'}
            ariaLabel="Select subcategory"
            disabled={!filters.categorySlug || subcategoryOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Subject</label>
          <SearchableSelect
            options={subjectOptions}
            value={filters.subjectSlug}
            onChange={handleSubjectChange}
            placeholder={
              filters.categorySlug
                ? subjectOptions.length > 0
                  ? 'All subjects'
                  : 'No subjects available'
                : 'Select a category or subcategory'
            }
            ariaLabel="Select subject"
            disabled={(filters.categorySlug === undefined && filters.subcategorySlug === undefined) || subjectOptions.length === 0}
          />
        </div>
      </div>

      <Stack direction="row" gap={3} className="flex-wrap">
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-medium text-gray-600">Exam</label>
          <SearchableSelect
            options={mappedExamOptions}
            value={filters.examSlug}
            onChange={handleExamChange}
            placeholder={filters.subjectSlug ? (isFetchingExams ? 'Loading exams…' : 'All exams') : 'Select a subject first'}
            ariaLabel="Select exam"
            disabled={!filters.subjectSlug || isFetchingExams || mappedExamOptions.length === 0}
          />
        </div>
        <div className="w-full max-w-md flex-1 space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Search by filename, description, or question stem"
          />
        </div>
      </Stack>
    </FilterPanel>
  );
}
