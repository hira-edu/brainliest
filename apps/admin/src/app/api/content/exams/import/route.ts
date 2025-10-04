import { NextResponse } from 'next/server';
import { ZodError } from '@brainliest/shared';
import { importExamTemplate } from '@/lib/exam-import';
import { getAdminActor } from '@/lib/auth';

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const result = await importExamTemplate(payload, actor.id);
    return NextResponse.json({ success: true, examSlug: result.examSlug, questionCount: result.questionCount });
  } catch (error) {
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

    return NextResponse.json({ success: false, error: 'Unexpected error importing exam.' }, { status: 500 });
  }
}
