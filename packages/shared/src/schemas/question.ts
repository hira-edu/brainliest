import { z } from 'zod';
import { ExamDifficulty, QuestionStatus } from '../domain/enums';

const maybeEmptyString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const questionOptionInputSchema = z.object({
  id: z.string().min(1, 'Option id is required'),
  label: z.string().min(1, 'Option label is required'),
  contentMarkdown: z.string().min(1, 'Option content is required'),
  isCorrect: z.boolean().optional().default(false),
});

export type QuestionOptionInput = z.infer<typeof questionOptionInputSchema>;

const questionCoreSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  explanation: maybeEmptyString,
  allowMultiple: z.boolean().default(false),
  difficulty: z.nativeEnum(ExamDifficulty, {
    errorMap: () => ({ message: 'Select a difficulty level' }),
  }),
  subjectSlug: z.string().min(1, 'Subject is required'),
  examSlug: maybeEmptyString,
  domain: maybeEmptyString,
  source: maybeEmptyString,
  year: z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === 'number') {
        return value;
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .optional(),
  status: z.nativeEnum(QuestionStatus, {
    errorMap: () => ({ message: 'Select a status' }),
  }),
  options: z.array(questionOptionInputSchema).min(2, 'Provide at least two options'),
});

const applyQuestionValidation = <Schema extends z.ZodTypeAny>(schema: Schema) =>
  schema.superRefine((input: z.infer<Schema>, ctx) => {
    const { options, allowMultiple } = input as unknown as z.infer<typeof questionCoreSchema>;
    const correctCount = options.reduce((total, option) => (option.isCorrect ? total + 1 : total), 0);

    if (correctCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Select at least one correct option',
      });
      return;
    }

    if (!allowMultiple && correctCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Only one option can be correct for single-answer questions',
      });
    }
  });

export const baseQuestionSchema = applyQuestionValidation(questionCoreSchema);

export type BaseQuestionPayload = z.infer<typeof baseQuestionSchema>;

export const createQuestionSchema = baseQuestionSchema;
export type CreateQuestionPayload = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = applyQuestionValidation(
  questionCoreSchema.extend({
    id: z.string().min(1, 'Question id is required'),
  })
);

export type UpdateQuestionPayload = z.infer<typeof updateQuestionSchema>;
