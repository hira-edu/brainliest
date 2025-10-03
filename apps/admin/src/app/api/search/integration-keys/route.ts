import { NextResponse } from 'next/server';
import type { IntegrationEnvironment } from '@brainliest/db';
import { searchIntegrationKeySuggestions } from '@/lib/integrations';

const MIN_QUERY_LENGTH = 2;
const ENVIRONMENTS: readonly IntegrationEnvironment[] = ['production', 'staging', 'development'];
const ENVIRONMENT_SET = new Set(ENVIRONMENTS);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const environmentParam = (searchParams.get('environment') ?? '').toLowerCase();
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 6;

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const environment = ENVIRONMENT_SET.has(environmentParam as IntegrationEnvironment)
    ? (environmentParam as IntegrationEnvironment)
    : undefined;

  const suggestions = await searchIntegrationKeySuggestions(query, limit, environment);

  return NextResponse.json({
    suggestions: suggestions.map((key) => ({
      value: key.name,
      label: `${key.environment} • ${key.id.slice(0, 8)}...`,
    })),
  });
}
