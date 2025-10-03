import { Badge, Icon } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { PaginationControl } from '@/components/pagination-control';
import { listMediaAssets, summarizeMediaCounts } from '@/lib/media';
import MediaFilters from '@/components/media-filters';

const DESCRIPTION = 'Upload, tag, and reuse media assets across questions and exams.';

interface MediaLibraryPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const assetTypeOptions = ['all', 'image', 'audio', 'file'] as const;

type AssetTypeOption = (typeof assetTypeOptions)[number];

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function extractFileName(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() ?? url;
  } catch {
    const segments = url.split('/');
    return segments[segments.length - 1] ?? url;
  }
}

export default async function MediaLibraryPage({ searchParams }: MediaLibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const typeParam = parseParam(resolvedSearchParams?.type) ?? 'all';
  const searchParam = parseParam(resolvedSearchParams?.search) ?? '';
  const categoryParam = parseParam(resolvedSearchParams?.category);
  const subcategoryParam = parseParam(resolvedSearchParams?.subcategory);
  const subjectParam = parseParam(resolvedSearchParams?.subject);
  const examParam = parseParam(resolvedSearchParams?.exam);
  const pageParam = parseParam(resolvedSearchParams?.page);

  const safeType: AssetTypeOption = assetTypeOptions.includes(typeParam as AssetTypeOption)
    ? (typeParam as AssetTypeOption)
    : 'all';

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;

  const [counts, mediaPage] = await Promise.all([
    summarizeMediaCounts(),
    listMediaAssets({
      page,
      type: safeType === 'all' ? undefined : safeType,
      categorySlug: categoryParam ?? undefined,
      subcategorySlug: subcategoryParam ?? undefined,
      subjectSlug: subjectParam ?? undefined,
      examSlug: examParam ?? undefined,
      search: searchParam.trim().length > 0 ? searchParam.trim() : undefined,
    }),
  ]);
  const initialFilters = {
    type: safeType,
    categorySlug: categoryParam ?? undefined,
    subcategorySlug: subcategoryParam ?? undefined,
    subjectSlug: subjectParam ?? undefined,
    examSlug: examParam ?? undefined,
    search: searchParam ? searchParam.trim() : undefined,
  };

  return (
    <AdminShell
      title="Media Library"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/media' },
        { label: 'Media Library', href: '/content/media', isCurrent: true },
      ]}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total assets" value={counts.total.toLocaleString()} icon="Images" />
        <MetricCard label="Images" value={counts.byType.image.toLocaleString()} icon="Image" />
        <MetricCard label="Audio" value={counts.byType.audio.toLocaleString()} icon="Music2" />
        <MetricCard label="Files" value={counts.byType.file.toLocaleString()} icon="File" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Asset inventory</h2>
          <p className="text-sm text-gray-600">
            Filter by asset type or search by filename, description, or associated question to locate reusable media quickly.
          </p>
        </header>

        <MediaFilters initialFilters={initialFilters} />

        <DataTable
          data={mediaPage.data}
          getRowKey={(asset) => asset.id}
          columns={[
            {
              id: 'preview',
              header: 'Preview',
              cell: (asset) => (
                <div className="flex items-center gap-3">
                  {asset.type === 'image' ? (
                    <a href={asset.url} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                      <img
                        src={asset.url}
                        alt={typeof asset.metadata.alt === 'string' ? asset.metadata.alt : 'Media preview'}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
                      <Icon
                        name={asset.type === 'audio' ? 'Music2' : 'File'}
                        className="h-6 w-6 text-gray-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="flex flex-col text-sm">
                    <a href={asset.url} target="_blank" rel="noreferrer" className="font-medium text-primary-600 hover:underline">
                      {extractFileName(asset.url)}
                    </a>
                    <span className="text-xs capitalize text-gray-500">{asset.type}</span>
                  </div>
                </div>
              ),
            },
            {
              id: 'question',
              header: 'Question context',
              cell: (asset) => (
                <div className="space-y-1">
                  <p className="line-clamp-2 text-sm text-gray-900">{asset.stemMarkdown ?? 'No question preview available.'}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <Badge variant="secondary">{asset.subjectSlug}</Badge>
                    {asset.examSlug ? <Badge variant="info">{asset.examSlug}</Badge> : null}
                  </div>
                </div>
              ),
            },
            {
              id: 'created',
              header: 'Uploaded',
              cell: (asset) => dateFormatter.format(asset.createdAt),
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {mediaPage.pagination.page} of {mediaPage.pagination.totalPages} ({mediaPage.pagination.totalCount.toLocaleString()} assets)
          </span>
          <PaginationControl page={mediaPage.pagination.page} totalPages={mediaPage.pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
