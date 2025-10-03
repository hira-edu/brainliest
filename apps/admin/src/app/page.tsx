import Link from 'next/link';
import { Card, Badge } from '@brainliest/ui';
import { fetchExplanationPage, fetchExplanationMetrics } from '@/lib/explanations';

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

export default async function AdminHomePage() {
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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-8 py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Monitor AI explanation activity across the platform and review the latest generations.
          </p>
          {latestGeneratedAt ? (
            <p className="text-sm text-gray-500">
              Last generation captured {timestampFormatter.format(latestGeneratedAt)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">No explanations generated yet.</p>
          )}
        </div>
        <Link
          prefetch={false}
          href="/explanations"
          className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          View full activity log
        </Link>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          header={<span className="text-sm font-medium uppercase tracking-wide text-gray-500">Total explanations</span>}
        >
          <p className="text-3xl font-semibold text-gray-900">
            {numberFormatter.format(totalExplanations)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Recorded in the explanation repository.</p>
        </Card>

        <Card
          header={<span className="text-sm font-medium uppercase tracking-wide text-gray-500">Tokens consumed</span>}
        >
          <p className="text-3xl font-semibold text-gray-900">
            {numberFormatter.format(tokensLifetime)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total tokens across all recorded explanations.</p>
        </Card>

        <Card
          header={
            <span className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Avg. cost per explanation
            </span>
          }
        >
          <p className="text-3xl font-semibold text-gray-900">
            {currencyFormatter.format(averageCostCents / 100)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Lifetime spend to date: {currencyFormatter.format(lifetimeCostCents / 100)}
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card
          header={
            <div className="flex items-center justify-between text-sm font-medium text-gray-600">
              <span>Latest {LATEST_SAMPLE_SIZE} generations</span>
              <Link prefetch={false} href="/explanations" className="text-gray-500 hover:text-gray-700">
                View all
              </Link>
            </div>
          }
          padding="sm"
        >
          {recentExplanations.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-gray-500">
              No AI explanations captured yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Generated</th>
                    <th scope="col" className="px-4 py-3">Question</th>
                    <th scope="col" className="px-4 py-3">Tokens</th>
                    <th scope="col" className="px-4 py-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentExplanations.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{timestampFormatter.format(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.questionStem}</div>
                        <div className="text-xs text-gray-500">
                          {item.subjectSlug} {item.examSlug ? `• ${item.examSlug}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{numberFormatter.format(item.tokensTotal)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {currencyFormatter.format(item.costCents / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          header={
            <span className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Top subjects (latest {LATEST_SAMPLE_SIZE})
            </span>
          }
        >
          {subjectLeaderboard.length === 0 ? (
            <p className="text-sm text-gray-500">No subject activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {subjectLeaderboard.map(([subject, count]) => (
                <li key={subject} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="font-medium capitalize">{subject.replace(/-/g, ' ')}</span>
                  <Badge variant="secondary">{count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <Card
          header={
            <div className="flex items-center justify-between text-sm font-medium text-gray-600">
              <span>Daily trend (last {metrics.windowDays} days)</span>
              <span className="text-xs text-gray-400">Totals are grouped in UTC</span>
            </div>
          }
          padding="sm"
        >
          {dailySeries.length === 0 ? (
            <p className="px-2 py-4 text-sm text-gray-500">No activity recorded in this window.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Day</th>
                  <th scope="col" className="px-4 py-3 text-right">Explanations</th>
                  <th scope="col" className="px-4 py-3 text-right">Tokens</th>
                  <th scope="col" className="px-4 py-3 text-right">Cost (¢)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailySeries.map((point) => (
                  <tr key={point.day} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{dayFormatter.format(new Date(point.day))}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                      {numberFormatter.format(point.totalCount)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {numberFormatter.format(point.tokensTotal)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {currencyFormatter.format(point.costCentsTotal / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </main>
  );
}
