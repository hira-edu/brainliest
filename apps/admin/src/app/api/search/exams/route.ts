import { NextResponse } from 'next/server';
import { searchExamSuggestions } from '@/lib/exams';
import { getAdminActor } from '@/lib/auth';

const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 8;

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await searchExamSuggestions(query, limit);
  return NextResponse.json({ suggestions });
}
