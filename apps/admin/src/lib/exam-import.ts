import 'server-only';

import { randomUUID } from 'crypto';
import type { ExamSlug } from '@brainliest/db';
import {
  CURRENT_EXAM_TEMPLATE_VERSION,
  buildExamTemplateSkeleton,
  examImportTemplateSchema,
  type ExamImportTemplate,
} from '@brainliest/shared';
import { repositories } from './repositories';

const SYSTEM_ACTOR_ID = 'admin-import';

export function generateExamTemplate(): ExamImportTemplate {
  return buildExamTemplateSkeleton();
}

export function serializeExamTemplate(template: ExamImportTemplate): string {
  return JSON.stringify(template, null, 2);
}

export interface ExamImportResult {
  readonly examSlug: ExamSlug;
  readonly questionCount: number;
}

export async function importExamTemplate(payload: unknown): Promise<ExamImportResult> {
  const template = examImportTemplateSchema.parse(payload);

  if (template.version !== CURRENT_EXAM_TEMPLATE_VERSION) {
    throw new Error(
      `Unsupported template version "${template.version}". Expected ${CURRENT_EXAM_TEMPLATE_VERSION}.`
    );
  }

  const existingExam = await repositories.exams.findBySlug(template.exam.slug);
  if (existingExam) {
    throw new Error(`Exam with slug "${template.exam.slug}" already exists.`);
  }

  const examSlug = await repositories.exams.create(
    {
      slug: template.exam.slug,
      subjectSlug: template.exam.subjectSlug,
      title: template.exam.title,
      description: template.exam.description ?? undefined,
      difficulty: template.exam.difficulty ?? undefined,
      durationMinutes: template.exam.durationMinutes ?? undefined,
      questionTarget: template.exam.questionTarget ?? undefined,
      status: template.exam.status,
      metadata: template.exam.metadata ?? {},
    },
    SYSTEM_ACTOR_ID
  );

  for (const question of template.questions) {
    const subjectSlug = question.subjectSlug || template.exam.subjectSlug;
    const options = question.options.map((option, index) => {
      const optionId = option.id ?? randomUUID();
      const label = option.label ?? String.fromCharCode(65 + index);
      return {
        id: optionId,
        label,
        contentMarkdown: option.contentMarkdown,
        isCorrect: option.isCorrect ?? false,
      };
    });

    const annotatedCorrectIndices = new Set<number>();
    options.forEach((option, index) => {
      if (option.isCorrect) {
        annotatedCorrectIndices.add(index);
      }
    });

    const explicitCorrectIndices = new Set<number>();
    if (typeof question.correctAnswer === 'number') {
      explicitCorrectIndices.add(question.correctAnswer);
    }
    for (const index of question.correctAnswers ?? []) {
      explicitCorrectIndices.add(index);
    }

    const mergedCorrectIndices = new Set<number>([
      ...annotatedCorrectIndices,
      ...explicitCorrectIndices,
    ]);

    if (mergedCorrectIndices.size === 0) {
      mergedCorrectIndices.add(0);
    }

    const allowMultiple = question.allowMultiple ?? mergedCorrectIndices.size > 1;
    const correctIndicesArray = Array.from(mergedCorrectIndices).sort((a, b) => a - b);

    const createInput = {
      text: question.text,
      options,
      allowMultiple,
      difficulty: question.difficulty,
      explanation: question.explanation ?? undefined,
      domain: question.domain ?? undefined,
      subjectSlug,
      examSlug,
      source: question.source ?? undefined,
      year: question.year ?? undefined,
      status: question.status ?? 'draft',
      correctAnswer: !allowMultiple ? correctIndicesArray[0] : undefined,
      correctAnswers: allowMultiple ? correctIndicesArray : undefined,
    } as const;

    const questionId = await repositories.questions.create(createInput, SYSTEM_ACTOR_ID);

    if (question.assets && question.assets.length > 0) {
      await repositories.media.createMany(
        question.assets.map((asset) => ({
          questionId,
          type: asset.type,
          url: asset.url,
          metadata: asset.metadata ?? {},
        }))
      );
    }
  }

  return {
    examSlug,
    questionCount: template.questions.length,
  };
}
