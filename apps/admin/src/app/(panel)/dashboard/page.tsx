import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { MetricCard } from '@/components/metric-card';
import { DataTable } from '@/components/data-table';
import { fetchExplanationMetrics, fetchExplanationPage } from '@/lib/explanations';

const LATEST_SAMPLE_SIZE = 5;
const METRICS_WINDOW_DAYS = 7;

const numberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

export default async function DashboardPage() {
  const [{ data: recentExplanations }, metrics] = await Promise.all([
    fetchExplanationPage({
      page: 1,
      pageSize: LATEST_SAMPLE_SIZE,
    }),
    fetchExplanationMetrics({ windowDays: METRICS_WINDOW_DAYS }),
  ]);

  const totalExplanations = metrics.totalCount;
  const tokensLifetime = metrics.tokensTotal;
  const lifetimeCostCents = metrics.costCentsTotal;
  const averageCostCents = metrics.averageCostCents;
  const dailySeries = metrics.series;
  const latestGeneratedAt = recentExplanations[0]?.createdAt ?? null;

  const topSubjects = recentExplanations.reduce<Record<string, number>>((acc, item) => {
    acc[item.subjectSlug] = (acc[item.subjectSlug] ?? 0) + 1;
    return acc;
  }, {});

  const subjectLeaderboard = Object.entries(topSubjects)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3);

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Monitor AI explanation activity across the platform and review the latest generations."
      pageActions={
        <Link
          prefetch={false}
          href="/ai/explanations"
          className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          View full activity log
        </Link>
      }
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isCurrent: true }]}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total explanations"
          value={numberFormatter.format(totalExplanations)}
          helperText="Recorded in the explanation repository."
          icon="BarChart3"
        />
        <MetricCard
          label="Tokens consumed"
          value={numberFormatter.format(tokensLifetime)}
          helperText="Tokens across all recorded explanations."
          icon="Database"
        />
        <MetricCard
          label="Avg. cost per explanation"
          value={currencyFormatter.format(averageCostCents / 100)}
          helperText={`Lifetime spend: ${currencyFormatter.format(lifetimeCostCents / 100)}`}
          icon="DollarSign"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-4">
          <header className="flex items-center justify-between text-sm font-medium text-gray-600">
            <span>Latest {LATEST_SAMPLE_SIZE} generations</span>
            <Link prefetch={false} href="/ai/explanations" className="text-gray-500 hover:text-gray-700">
              View all
            </Link>
          </header>

          <DataTable
            data={recentExplanations}
            getRowKey={(item) => item.id}
            columns={[
              {
                id: 'generatedAt',
                header: 'Generated',
                cell: (item) => timestampFormatter.format(item.createdAt),
              },
              {
                id: 'question',
                header: 'Question',
                cell: (item) => (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{item.questionStem}</div>
                    <div className="text-xs text-gray-500">
                      {item.subjectSlug} {item.examSlug ? `• ${item.examSlug}` : ''}
                    </div>
                  </div>
                ),
              },
              {
                id: 'tokens',
                header: 'Tokens',
                cell: (item) => numberFormatter.format(item.tokensTotal),
                align: 'right',
              },
              {
                id: 'cost',
                header: 'Cost',
                cell: (item) => currencyFormatter.format(item.costCents / 100),
                align: 'right',
              },
            ]}
            emptyState="No AI explanations captured yet."
          />
        </section>

        <section className="space-y-4">
          <header className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Top subjects (latest {LATEST_SAMPLE_SIZE})
          </header>
          {subjectLeaderboard.length === 0 ? (
            <p className="text-sm text-gray-500">No subject activity yet.</p>
          ) : (
            <ul className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {subjectLeaderboard.map(([subject, count]) => (
                <li key={subject} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="font-medium capitalize">{subject.replace(/-/g, ' ')}</span>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
            {latestGeneratedAt ? (
              <div className="space-y-1">
                <p className="font-medium text-gray-900">Last generation</p>
                <p className="text-gray-600">{timestampFormatter.format(latestGeneratedAt)}</p>
              </div>
            ) : (
              <p className="text-gray-500">No explanations generated yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <header className="flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">Daily trend (last {metrics.windowDays} days)</span>
          <span className="text-xs text-gray-400">Totals are grouped in UTC</span>
        </header>

        <DataTable
          data={dailySeries}
          getRowKey={(point) => point.day}
          dense
          columns={[
            {
              id: 'day',
              header: 'Day',
              cell: (point) => dayFormatter.format(new Date(point.day)),
            },
            {
              id: 'explanations',
              header: 'Explanations',
              cell: (point) => numberFormatter.format(point.totalCount),
              align: 'right',
            },
            {
              id: 'tokens',
              header: 'Tokens',
              cell: (point) => numberFormatter.format(point.tokensTotal),
              align: 'right',
            },
            {
              id: 'cost',
              header: 'Cost',
              cell: (point) => currencyFormatter.format(point.costCentsTotal / 100),
              align: 'right',
            },
          ]}
          emptyState="No activity recorded in this window."
        />
      </section>
    </AdminShell>
  );
}
