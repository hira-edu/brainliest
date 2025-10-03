import 'server-only';

import { NextResponse } from 'next/server';
import { getExamsBySubject } from '@/lib/taxonomy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subjectSlug = url.searchParams.get('subject');

  if (!subjectSlug) {
    return NextResponse.json({ options: [] });
  }

  try {
    const options = await getExamsBySubject(subjectSlug);
    return NextResponse.json({ options });
  } catch (error) {
    console.error('[api/taxonomy/exams] failed to load exams', error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
