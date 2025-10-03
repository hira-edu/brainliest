import { z } from 'zod';
import {
  ExamDifficulty,
  ExamStatus,
  QuestionAssetType,
  QuestionStatus,
} from '../domain/enums';

function assertNonEmptyTuple<T extends string>(values: readonly T[], label: string): [T, ...T[]] {
  if (values.length === 0) {
    throw new Error(`${label} enum has no values`);
  }

  return values as [T, ...T[]];
}

const examDifficultyEnum = z.enum(assertNonEmptyTuple(Object.values(ExamDifficulty), 'ExamDifficulty'));
const examStatusEnum = z.enum(assertNonEmptyTuple(Object.values(ExamStatus), 'ExamStatus'));
const questionStatusEnum = z.enum(assertNonEmptyTuple(Object.values(QuestionStatus), 'QuestionStatus'));
const questionAssetTypeEnum = z.enum(assertNonEmptyTuple(Object.values(QuestionAssetType), 'QuestionAssetType'));

const metadataSchema = z.record(z.string(), z.unknown()).default({});

const questionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  contentMarkdown: z.string().min(1),
  isCorrect: z.boolean().optional(),
});

const questionAssetSchema = z.object({
  type: questionAssetTypeEnum,
  url: z.string().url(),
  metadata: metadataSchema.optional(),
});

const questionTemplateSchema = z
  .object({
    subjectSlug: z.string().min(1),
    examSlug: z.string().min(1).optional(),
    domain: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    status: questionStatusEnum.default(QuestionStatus.DRAFT),
    difficulty: examDifficultyEnum,
    allowMultiple: z.boolean().default(false),
    text: z.string().min(1),
    explanation: z.string().min(1).optional(),
    options: z.array(questionOptionSchema).min(2),
    correctAnswer: z.number().int().min(0).optional(),
    correctAnswers: z.array(z.number().int().min(0)).optional(),
    assets: z.array(questionAssetSchema).optional(),
    tags: z.array(z.string().min(1)).optional(),
    metadata: metadataSchema,
  })
  .superRefine((question, ctx) => {
    const { options, allowMultiple, correctAnswer, correctAnswers } = question;

    const explicitCorrectIndices = new Set<number>();
    const annotatedCorrectIndices = new Set<number>();

    if (typeof correctAnswer === 'number') {
      explicitCorrectIndices.add(correctAnswer);
    }

    for (const index of correctAnswers ?? []) {
      explicitCorrectIndices.add(index);
    }

    options.forEach((option, index) => {
      if (option.isCorrect) {
        annotatedCorrectIndices.add(index);
      }
    });

    const allCorrectIndices = new Set<number>([...explicitCorrectIndices, ...annotatedCorrectIndices]);

    if (allCorrectIndices.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one correct answer must be provided via correctAnswer, correctAnswers, or option.isCorrect',
        path: ['options'],
      });
    }

    if (!allowMultiple && allCorrectIndices.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Single-answer questions must have exactly one correct answer',
        path: ['allowMultiple'],
      });
    }
  });

const examInfoSchema = z.object({
  slug: z.string().min(1),
  subjectSlug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  difficulty: examDifficultyEnum.optional(),
  durationMinutes: z.number().int().min(1).optional(),
  questionTarget: z.number().int().min(1).optional(),
  status: examStatusEnum.default(ExamStatus.DRAFT),
  metadata: metadataSchema,
});

export const CURRENT_EXAM_TEMPLATE_VERSION = '2025-10-04';

export const examImportTemplateSchema = z.object({
  version: z.string().default(CURRENT_EXAM_TEMPLATE_VERSION),
  reference: z.object({
    examStatuses: z.array(examStatusEnum),
    examDifficulties: z.array(examDifficultyEnum),
    questionStatuses: z.array(questionStatusEnum),
    questionDifficulties: z.array(examDifficultyEnum),
    questionAssetTypes: z.array(questionAssetTypeEnum),
  }),
  exam: examInfoSchema,
  questions: z.array(questionTemplateSchema),
});

export type ExamImportTemplate = z.infer<typeof examImportTemplateSchema>;

export function buildExamTemplateSkeleton(): ExamImportTemplate {
  const examStatuses = Object.values(ExamStatus);
  const examDifficulties = Object.values(ExamDifficulty);
  const questionStatuses = Object.values(QuestionStatus);
  const assetTypes = Object.values(QuestionAssetType);

  return {
    version: CURRENT_EXAM_TEMPLATE_VERSION,
    reference: {
      examStatuses,
      examDifficulties,
      questionStatuses,
      questionDifficulties: examDifficulties,
      questionAssetTypes: assetTypes,
    },
    exam: {
      slug: '',
      subjectSlug: '',
      title: '',
      status: ExamStatus.DRAFT,
      metadata: {},
    },
    questions: [
      {
        subjectSlug: '',
        status: QuestionStatus.DRAFT,
        difficulty: examDifficulties[0] ?? ExamDifficulty.MEDIUM,
        allowMultiple: false,
        text: '',
        options: [
          { label: 'A', contentMarkdown: '' },
          { label: 'B', contentMarkdown: '' },
        ],
        correctAnswer: 0,
        metadata: {},
      },
    ],
  };
}
