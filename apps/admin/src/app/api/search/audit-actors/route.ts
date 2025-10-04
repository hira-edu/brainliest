import { NextResponse } from 'next/server';
import type { AuditActorType } from '@brainliest/db';
import { searchAuditActorSuggestions } from '@/lib/audit';

const MIN_QUERY_LENGTH = 2;
const ACTOR_TYPES: readonly AuditActorType[] = ['admin', 'user', 'system'];
const ACTOR_TYPE_SET = new Set<string>(ACTOR_TYPES);

export async function GET(request: Request) {
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
}
