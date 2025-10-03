import { Badge } from '@brainliest/ui';
import { FEATURE_FLAGS } from '@brainliest/config/feature-flags';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';

const DESCRIPTION = 'Toggle platform capabilities with auditable change notes.';

const flags = Object.entries(FEATURE_FLAGS).map(([key, value]) => ({
  name: key,
  ...value,
}));

const totalFlags = flags.length;
const booleanFlags = flags.filter((flag) => flag.rolloutType === 'boolean').length;
const numericFlags = flags.filter((flag) => flag.rolloutType === 'number').length;

export default function FeatureFlagsPage() {
  return (
    <AdminShell
      title="Feature Flags"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/feature-flags' },
        { label: 'Feature Flags', href: '/settings/feature-flags', isCurrent: true },
      ]}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total flags" value={totalFlags.toString()} icon="ToggleLeft" />
        <MetricCard label="Boolean" value={booleanFlags.toString()} icon="CircleCheck" />
        <MetricCard label="Numeric" value={numericFlags.toString()} icon="Hash" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Flag registry</h2>
          <p className="text-sm text-gray-600">
            Defaults are sourced from the configuration SSOT. Changes should pass through rollout playbooks before toggling in production.
          </p>
        </header>

        <DataTable
          data={flags}
          getRowKey={(flag) => flag.name}
          columns={[
            {
              id: 'flag',
              header: 'Flag',
              cell: (flag) => (
                <div className="space-y-1">
                  <span className="font-medium text-gray-900">{flag.name}</span>
                  <span className="text-xs text-gray-500">{flag.description}</span>
                </div>
              ),
            },
            {
              id: 'type',
              header: 'Type',
              cell: (flag) => (
                <Badge variant="secondary" className="capitalize">
                  {flag.rolloutType}
                </Badge>
              ),
            },
            {
              id: 'default',
              header: 'Default value',
              cell: (flag) => (
                <span className="font-mono text-sm text-gray-900">{String(flag.defaultValue)}</span>
              ),
            },
            {
              id: 'key',
              header: 'Config key',
              cell: (flag) => (
                <code className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">{flag.key}</code>
              ),
            },
          ]}
        />
      </section>
    </AdminShell>
  );
}
