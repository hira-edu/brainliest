import 'server-only';

import { NextResponse } from 'next/server';
import { drizzleClient, DrizzleExplanationRepository } from '@brainliest/db';

const repository = new DrizzleExplanationRepository(drizzleClient);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const pageParam = url.searchParams.get('page');
  const pageSizeParam = url.searchParams.get('pageSize');

  const parsedPage = Number(pageParam);
  const parsedPageSize = Number(pageSizeParam ?? limitParam);

  const page = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const pageSize = Number.isFinite(parsedPageSize)
    ? Math.min(Math.max(parsedPageSize, 1), 100)
    : 20;

  const { data, pagination } = await repository.listRecent({ page, pageSize });

  return NextResponse.json({
    data: data.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      questionVersionId: item.questionVersionId,
      answerPattern: item.answerPattern,
      model: item.model,
      language: item.language,
      tokensTotal: item.tokensTotal,
      costCents: item.costCents,
      createdAt: item.createdAt.toISOString(),
      subjectSlug: item.subjectSlug,
      examSlug: item.examSlug,
      questionStem: item.questionStem,
    })),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: pagination.totalCount,
      totalPages: pagination.totalPages,
    },
  });
}
