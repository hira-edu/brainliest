import { z } from 'zod';
import { CategoryKind, ExamDifficulty } from '../domain/enums';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(255)
  .regex(/^[a-z0-9-]+$/i, 'Use letters, numbers, and hyphens only')
  .transform((value) => value.toLowerCase());

const optionalString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalNumber = z
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

const optionalBoolean = z
  .union([z.string(), z.boolean()])
  .transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === '1' || trimmed === 'on') {
      return true;
    }
    if (trimmed === 'false' || trimmed === '0' || trimmed === 'off') {
      return false;
    }
    return undefined;
  })
  .optional();

const metadataSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return {} as Record<string, unknown>;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'Metadata must be valid JSON',
          path: ['metadata'],
        },
      ]);
    }

    return {} as Record<string, unknown>;
  });

const tagsSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return [] as string[];
    }
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  });

export const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(CategoryKind, {
    errorMap: () => ({ message: 'Select a category type' }),
  }),
  description: optionalString,
  icon: optionalString,
  sortOrder: optionalNumber,
  active: optionalBoolean,
});

export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.extend({
  slug: slugSchema,
});

export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;

export const createSubcategorySchema = z.object({
  slug: slugSchema,
  categorySlug: z.string().min(1, 'Parent category is required'),
  name: z.string().min(1, 'Name is required'),
  description: optionalString,
  icon: optionalString,
  sortOrder: optionalNumber,
  active: optionalBoolean,
});

export type CreateSubcategoryPayload = z.infer<typeof createSubcategorySchema>;

export const updateSubcategorySchema = createSubcategorySchema.extend({
  slug: slugSchema,
});

export type UpdateSubcategoryPayload = z.infer<typeof updateSubcategorySchema>;

export const createSubjectSchema = z.object({
  slug: slugSchema,
  categorySlug: z.string().min(1, 'Category is required'),
  subcategorySlug: optionalString,
  name: z.string().min(1, 'Name is required'),
  description: optionalString,
  icon: optionalString,
  difficulty: z
    .nativeEnum(ExamDifficulty, {
      errorMap: () => ({ message: 'Select a difficulty level' }),
    })
    .optional(),
  tags: tagsSchema,
  metadata: metadataSchema,
  active: optionalBoolean,
});

export type CreateSubjectPayload = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema.extend({
  slug: slugSchema,
});

export type UpdateSubjectPayload = z.infer<typeof updateSubjectSchema>;
