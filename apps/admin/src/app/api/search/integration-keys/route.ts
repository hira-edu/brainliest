import { NextResponse } from 'next/server';
import type { IntegrationEnvironment } from '@brainliest/db';
import { searchIntegrationKeySuggestions } from '@/lib/integrations';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

const MIN_QUERY_LENGTH = 2;
const ENVIRONMENTS: readonly IntegrationEnvironment[] = ['production', 'staging', 'development'];
const ENVIRONMENT_SET = new Set(ENVIRONMENTS);

export async function GET(request: Request) {
  try {
    await requireAdminActor();

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
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/search/integration-keys] failed to provide suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
