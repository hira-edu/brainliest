import { z } from 'zod';

export const requestExplanationSchema = z.object({
  questionId: z.string().min(1, 'questionId is required'),
  selectedChoiceIds: z.array(z.string().min(1)).min(1, 'at least one choice is required'),
  locale: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/u, 'locale must follow BCP 47 short format')
    .default('en'),
});

export type RequestExplanationInput = z.infer<typeof requestExplanationSchema>;

export const explanationDtoSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).min(1),
  relatedConcepts: z.array(z.string().min(1)).optional(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type ExplanationDtoShape = z.infer<typeof explanationDtoSchema>;
