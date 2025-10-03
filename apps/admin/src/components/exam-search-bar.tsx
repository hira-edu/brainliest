'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@brainliest/ui';

interface ExamSearchBarProps {
  readonly initialValue?: string;
}

interface ExamSuggestion {
  readonly value: string;
  readonly label: string;
}

const MIN_QUERY_LENGTH = 2;

interface ExamSearchResponse {
  readonly suggestions?: ReadonlyArray<{ readonly slug: string; readonly title: string }>;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const extractSuggestions = (payload: unknown): ExamSuggestion[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const maybeSuggestions = (payload as ExamSearchResponse).suggestions;
  if (!Array.isArray(maybeSuggestions)) {
    return [];
  }

  return maybeSuggestions
    .filter((item): item is { readonly slug: string; readonly title: string } =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { slug?: unknown }).slug === 'string' &&
      typeof (item as { title?: unknown }).title === 'string'
    )
    .map((item) => ({
      value: item.title,
      label: item.slug,
    }));
};

export function ExamSearchBar({ initialValue = '' }: ExamSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<ExamSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);

    fetch(`/api/search/exams?q=${encodeURIComponent(trimmed)}&limit=6`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load exam suggestions');
        }
        const payload: unknown = await response.json().catch(() => null);
        setSuggestions(extractSuggestions(payload));
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error(error);
          setSuggestions([]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [value]);

  const datalistId = useId();

  const updateQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (nextValue.trim().length === 0) {
        params.delete('search');
      } else {
        params.set('search', nextValue.trim());
      }
      params.delete('page');
      const query = params.toString();
      router.push(query.length > 0 ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateQuery(value);
    },
    [updateQuery, value]
  );

  const handleClear = useCallback(() => {
    setValue('');
    setSuggestions([]);
    updateQuery('');
  }, [updateQuery]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          type="search"
          name="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search exams by title or slug"
          list={datalistId}
          aria-label="Search exams"
          className="flex-1"
        />
        <datalist id={datalistId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion.label} value={suggestion.value} label={suggestion.label} />
          ))}
        </datalist>
      </div>
      <div className="flex items-center gap-2">
        {value.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isLoading}>
          Search
        </Button>
      </div>
    </form>
  );
}
