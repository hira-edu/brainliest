import { NextResponse } from 'next/server';
import { searchQuestionsSuggestions } from '@/lib/questions';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  try {
    await requireAdminActor();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 8;

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await searchQuestionsSuggestions(query, limit);
    return NextResponse.json({ suggestions });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/search/questions] failed to fetch suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
