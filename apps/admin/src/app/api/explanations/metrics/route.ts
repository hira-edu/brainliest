import 'server-only';

import { NextResponse } from 'next/server';
import { drizzleClient, DrizzleExplanationRepository } from '@brainliest/db';
import type { ExplanationRepository } from '@brainliest/db';

import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

const repository: ExplanationRepository = new DrizzleExplanationRepository(drizzleClient);

export async function GET(request: Request) {
  try {
    await requireAdminActor();

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
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/explanations/metrics] failed to load metrics', error);
    return NextResponse.json({ error: 'Failed to load explanation metrics.' }, { status: 500 });
  }
}
