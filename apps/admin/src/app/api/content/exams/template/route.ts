import { NextResponse } from 'next/server';
import { CURRENT_EXAM_TEMPLATE_VERSION } from '@brainliest/shared';
import { generateExamTemplate } from '@/lib/exam-import';

export function GET() {
  const template = generateExamTemplate();
  const body = JSON.stringify(template, null, 2);

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="exam-template-${CURRENT_EXAM_TEMPLATE_VERSION}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
