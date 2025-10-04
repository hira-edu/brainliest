import 'server-only';

import { NextResponse } from 'next/server';
import { getExamsBySubject } from '@/lib/taxonomy';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

export async function GET(request: Request) {
  try {
    await requireAdminActor();

    const url = new URL(request.url);
    const subjectSlug = url.searchParams.get('subject');

    if (!subjectSlug) {
      return NextResponse.json({ options: [] });
    }

    const options = await getExamsBySubject(subjectSlug);
    return NextResponse.json({ options });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/taxonomy/exams] failed to load exams', error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
