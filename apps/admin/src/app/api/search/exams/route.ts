import { NextResponse } from 'next/server';
import { searchExamSuggestions } from '@/lib/exams';

const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
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
