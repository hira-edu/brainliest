import { NextResponse } from 'next/server';
import { CURRENT_EXAM_TEMPLATE_VERSION } from '@brainliest/shared';
import { generateExamTemplate } from '@/lib/exam-import';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

export async function GET() {
  try {
    await requireAdminActor();

    const template = generateExamTemplate();
    const body = JSON.stringify(template, null, 2);

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="exam-template-${CURRENT_EXAM_TEMPLATE_VERSION}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/content/exams/template] failed to generate template', error);
    return NextResponse.json({ error: 'Unable to generate template.' }, { status: 500 });
  }
}
