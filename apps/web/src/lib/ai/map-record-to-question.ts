/*
 * Drizzle returns typed records, but without project-aware lint configuration Next.js flags them as `any`.
 * Disable unsafe-operation rules for this mapping helper.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import type { QuestionModel } from '@brainliest/shared';
import type { QuestionRecord } from '@brainliest/db';

const KATEX_PATTERN = /\\|\$/u;

export function mapRecordToQuestionModel(record: QuestionRecord): QuestionModel {
  const hasKatex =
    KATEX_PATTERN.test(record.stemMarkdown) ||
    record.options.some((option) => KATEX_PATTERN.test(option.contentMarkdown));

  return {
    id: record.id as QuestionModel['id'],
    examSlug: (record.examSlug ?? record.subjectSlug) as QuestionModel['examSlug'],
    subjectSlug: record.subjectSlug as QuestionModel['subjectSlug'],
    type: record.type,
    difficulty: record.difficulty,
    stemMarkdown: record.stemMarkdown,
    hasKatex,
    options: record.options.map((option) => ({
      id: option.id,
      label: option.label,
      contentMarkdown: option.contentMarkdown,
    })),
    correctChoiceIds: [...record.correctChoiceIds],
    explanationMarkdown: record.explanationMarkdown ?? undefined,
    source: record.source ?? undefined,
    year: record.year ?? undefined,
    currentVersionId: record.currentVersionId ?? record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
