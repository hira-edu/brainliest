import { NextResponse } from 'next/server';
import { ZodError } from '@brainliest/shared';
import { importExamTemplate } from '@/lib/exam-import';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const result = await importExamTemplate(payload, actor.id);
    return NextResponse.json({ success: true, examSlug: result.examSlug, questionCount: result.questionCount });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template validation failed.',
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const status = error.message.includes('already exists') ? 409 : 500;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }

    console.error('[api/content/exams/import] unexpected failure', error);
    return NextResponse.json({ success: false, error: 'Unexpected error importing exam.' }, { status: 500 });
  }
}
