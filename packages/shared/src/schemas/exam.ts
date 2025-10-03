import { z } from 'zod';
import { ExamDifficulty, ExamStatus } from '../domain/enums';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(255)
  .regex(/^[a-z0-9-]+$/i, 'Use letters, numbers, and hyphens only')
  .transform((value) => value.toLowerCase());

const maybeOptionalString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const toOptionalNumber = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  .optional();

export const createExamSchema = z.object({
  slug: slugSchema,
  subjectSlug: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required'),
  description: maybeOptionalString,
  difficulty: z
    .nativeEnum(ExamDifficulty, {
      errorMap: () => ({ message: 'Select a difficulty level' }),
    })
    .optional(),
  durationMinutes: toOptionalNumber,
  questionTarget: toOptionalNumber,
  status: z
    .nativeEnum(ExamStatus, {
      errorMap: () => ({ message: 'Select a status' }),
    })
    .default(ExamStatus.DRAFT),
});

export type CreateExamPayload = z.infer<typeof createExamSchema>;

export const updateExamSchema = createExamSchema.extend({
  slug: slugSchema,
});

export type UpdateExamPayload = z.infer<typeof updateExamSchema>;
