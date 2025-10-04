import { z } from 'zod';

export const integrationKeyTypeEnum = z.enum(['OPENAI', 'STRIPE', 'RESEND', 'CAPTCHA']);
export const integrationEnvironmentEnum = z.enum(['production', 'staging', 'development']);

export const createIntegrationKeySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name is too long'),
  type: integrationKeyTypeEnum,
  environment: integrationEnvironmentEnum,
  description: z.string().trim().max(500).optional().nullable(),
  value: z.string().min(8, 'Key value must be at least 8 characters long'),
});

export const rotateIntegrationKeySchema = z.object({
  id: z.string().uuid('Integration key id must be a valid UUID'),
  value: z.string().min(8, 'Key value must be at least 8 characters long'),
});

export type CreateIntegrationKeyPayload = z.infer<typeof createIntegrationKeySchema>;
export type RotateIntegrationKeyPayload = z.infer<typeof rotateIntegrationKeySchema>;
