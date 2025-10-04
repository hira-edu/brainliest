import { NextResponse } from 'next/server';
import type { AuditActorType } from '@brainliest/db';
import { searchAuditActorSuggestions } from '@/lib/audit';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

const MIN_QUERY_LENGTH = 2;
const ACTOR_TYPES: readonly AuditActorType[] = ['admin', 'user', 'system'];
const ACTOR_TYPE_SET = new Set<string>(ACTOR_TYPES);

export async function GET(request: Request) {
  try {
    await requireAdminActor();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 6;
    const actorTypeParam = (searchParams.get('actorType') ?? '').toLowerCase();

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await searchAuditActorSuggestions(query, limit);

    const filtered = ACTOR_TYPE_SET.has(actorTypeParam)
      ? suggestions.filter((item) => item.actorType === (actorTypeParam as AuditActorType))
      : suggestions;

    return NextResponse.json({
      suggestions: filtered.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/search/audit-actors] failed to provide suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
