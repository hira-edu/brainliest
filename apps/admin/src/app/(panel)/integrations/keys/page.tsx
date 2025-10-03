import Link from 'next/link';
import { Badge, Button } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { listIntegrationKeys, countIntegrationKeysByEnvironment } from '@/lib/integrations';
import { PaginationControl } from '@/components/pagination-control';
import IntegrationFilters from '@/components/integration-filters';
import type { IntegrationFiltersInitialValues } from '@/types/filter-values';

const DESCRIPTION = 'Manage third-party secrets, check rotation cadence, and keep environments in sync.';

interface IntegrationKeysPageProps {
  readonly searchParams?: Promise<Record<string, string | string[]>>;
}

const ENV_OPTIONS = ['all', 'production', 'staging', 'development'] as const;
const TYPE_OPTIONS = ['all', 'OPENAI', 'STRIPE', 'RESEND', 'CAPTCHA'] as const;

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function environmentBadge(env: string): Parameters<typeof Badge>[0]['variant'] {
  switch (env) {
    case 'production':
      return 'success';
    case 'staging':
      return 'info';
    case 'development':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default async function IntegrationKeysPage({ searchParams }: IntegrationKeysPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const environmentParam = parseParam(resolvedSearchParams?.environment) ?? 'all';
  const typeParam = parseParam(resolvedSearchParams?.type) ?? 'all';
  const searchParam = parseParam(resolvedSearchParams?.search);
  const pageParam = parseParam(resolvedSearchParams?.page);

  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10)) : 1;
  const searchValue = searchParam?.trim() ?? '';

  const normalizedEnvironment = ENV_OPTIONS.includes(environmentParam as (typeof ENV_OPTIONS)[number]) && environmentParam !== 'all'
    ? (environmentParam as 'production' | 'staging' | 'development')
    : undefined;

  const normalizedType = TYPE_OPTIONS.includes(typeParam as (typeof TYPE_OPTIONS)[number]) && typeParam !== 'all'
    ? (typeParam as 'OPENAI' | 'STRIPE' | 'RESEND' | 'CAPTCHA')
    : undefined;

  const keysPage = await listIntegrationKeys({
    environment: normalizedEnvironment,
    type: normalizedType,
    page,
    search: searchValue.length > 0 ? searchValue : undefined,
  });

  const [productionCount, stagingCount, developmentCount] = await Promise.all([
    countIntegrationKeysByEnvironment('production'),
    countIntegrationKeysByEnvironment('staging'),
    countIntegrationKeysByEnvironment('development'),
  ]);

  const initialFilters: IntegrationFiltersInitialValues = {
    environment: normalizedEnvironment ?? 'all',
    type: normalizedType ?? 'all',
    search: searchValue,
  };

  return (
    <AdminShell
      title="Integration Keys"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Integrations', href: '/integrations/keys' },
        { label: 'Keys', href: '/integrations/keys', isCurrent: true },
      ]}
      pageActions={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/integrations/keys/new">Create key</Link>
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Production" value={numberFormatter.format(productionCount)} icon="Server" />
        <MetricCard label="Staging" value={numberFormatter.format(stagingCount)} icon="TestTube" />
        <MetricCard label="Development" value={numberFormatter.format(developmentCount)} icon="FlaskRound" />
        <MetricCard label="Page results" value={numberFormatter.format(keysPage.pagination.totalCount)} icon="KeySquare" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Key vault</h2>
          <p className="text-sm text-gray-600">Filter by environment to confirm credentials are rotated on schedule.</p>
        </header>

        <IntegrationFilters initialFilters={initialFilters} />

        <DataTable
          data={keysPage.data}
          getRowKey={(key) => key.id}
          columns={[
            {
              id: 'name',
              header: 'Integration',
              cell: (key) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{key.name}</span>
                  {key.description ? <span className="text-xs text-gray-500">{key.description}</span> : null}
                </div>
              ),
            },
            {
              id: 'type',
              header: 'Type',
              cell: (key) => key.type,
            },
            {
              id: 'environment',
              header: 'Environment',
              cell: (key) => (
                <Badge variant={environmentBadge(key.environment)} className="capitalize">
                  {key.environment}
                </Badge>
              ),
            },
            {
              id: 'rotated',
              header: 'Last rotated',
              cell: (key) => (key.lastRotatedAt ? dateFormatter.format(key.lastRotatedAt) : 'Not rotated'),
            },
            {
              id: 'createdBy',
              header: 'Created by',
              cell: (key) => key.createdByAdminEmail ?? '—',
            },
            {
              id: 'createdAt',
              header: 'Created',
              cell: (key) => dateFormatter.format(key.createdAt),
            },
          ]}
        />

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
          <span className="text-sm text-gray-600">
            Showing page {keysPage.pagination.page} of {keysPage.pagination.totalPages} ({numberFormatter.format(keysPage.pagination.totalCount)} keys)
          </span>
          <PaginationControl page={keysPage.pagination.page} totalPages={keysPage.pagination.totalPages} />
        </footer>
      </section>
    </AdminShell>
  );
}
