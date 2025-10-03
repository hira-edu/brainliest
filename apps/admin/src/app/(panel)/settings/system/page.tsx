import os from 'os';
import { Badge } from '@brainliest/ui';
import { AdminShell } from '@/components/admin-shell';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';

const DESCRIPTION = 'Configure global platform behaviour, authentication, and environment defaults.';

const systemMetrics = {
  nodeVersion: process.version,
  platform: process.platform,
  architecture: process.arch,
  cpuCount: os.cpus().length,
  totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
  environment: process.env.NODE_ENV ?? 'unknown',
};

const configurationRows = [
  {
    key: 'Environment',
    value: systemMetrics.environment,
    description: 'Determines configuration presets for logging, caching, and debugging.',
  },
  {
    key: 'Node runtime',
    value: systemMetrics.nodeVersion,
    description: 'Deployed Node.js version powering the admin server runtime.',
  },
  {
    key: 'Platform',
    value: `${systemMetrics.platform} (${systemMetrics.architecture})`,
    description: 'Underlying operating system and architecture for the current instance.',
  },
  {
    key: 'CPU cores',
    value: String(systemMetrics.cpuCount),
    description: 'Logical cores available to the serverless function or container.',
  },
  {
    key: 'Memory budget',
    value: `${systemMetrics.totalMemory} GB`,
    description: 'Approximate total system memory. Real quotas may vary by deployment provider.',
  },
];

export default function SystemSettingsPage() {
  return (
    <AdminShell
      title="System Settings"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings/system' },
        { label: 'System Settings', href: '/settings/system', isCurrent: true },
      ]}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Environment" value={systemMetrics.environment.toUpperCase()} icon="Server" />
        <MetricCard label="Node runtime" value={systemMetrics.nodeVersion.replace('v', '')} icon="Cpu" />
        <MetricCard label="CPU cores" value={String(systemMetrics.cpuCount)} icon="Gauge" />
        <MetricCard label="Total memory" value={`${systemMetrics.totalMemory} GB`} icon="Database" />
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Runtime configuration</h2>
          <p className="text-sm text-gray-600">
            Monitor the execution environment to ensure feature flags, caching, and authentication modules align with infrastructure expectations.
          </p>
        </header>

        <DataTable
          data={configurationRows}
          getRowKey={(row) => row.key}
          columns={[
            {
              id: 'key',
              header: 'Setting',
              cell: (row) => <span className="font-medium text-gray-900">{row.key}</span>,
            },
            {
              id: 'value',
              header: 'Value',
              cell: (row) => <Badge variant="secondary">{row.value}</Badge>,
            },
            {
              id: 'description',
              header: 'Notes',
              cell: (row) => <span className="text-sm text-gray-600">{row.description}</span>,
            },
          ]}
        />
      </section>
    </AdminShell>
  );
}
