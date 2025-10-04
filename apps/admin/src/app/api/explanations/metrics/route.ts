import 'server-only';

import { NextResponse } from 'next/server';
import { drizzleClient, DrizzleExplanationRepository } from '@brainliest/db';
import type { ExplanationRepository } from '@brainliest/db';

import { getAdminActor } from '@/lib/auth';

const repository: ExplanationRepository = new DrizzleExplanationRepository(drizzleClient);

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const windowRaw = url.searchParams.get('window');
  const windowParam = windowRaw === null ? undefined : Number(windowRaw);
  const windowDays =
    windowParam === undefined || !Number.isFinite(windowParam)
      ? 7
      : Math.min(Math.max(Math.trunc(windowParam), 1), 90);

  const [totals, dailyTotals] = await Promise.all([
    repository.getAggregateTotals(),
    repository.listDailyTotals({ days: windowDays }),
  ]);

  return NextResponse.json({
    totalCount: totals.totalCount,
    tokensTotal: totals.tokensTotal,
    costCentsTotal: totals.costCentsTotal,
    averageCostCents: totals.totalCount > 0 ? Math.round(totals.costCentsTotal / totals.totalCount) : 0,
    averageTokens: totals.totalCount > 0 ? Math.round(totals.tokensTotal / totals.totalCount) : 0,
    windowDays,
    series: dailyTotals.map((item) => ({
      day: item.day.toISOString().slice(0, 10),
      totalCount: item.totalCount,
      tokensTotal: item.tokensTotal,
      costCentsTotal: item.costCentsTotal,
    })),
  });
}
