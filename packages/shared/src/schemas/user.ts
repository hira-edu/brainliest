import { z } from 'zod';
import { UserRole } from '../domain/enums';

const statusOptions = ['active', 'suspended'] as const;

const baseUserSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Provide a valid email address'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Select a role' }),
  }),
  status: z.enum(statusOptions).default('active'),
  profile: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional()
    .transform((value) => {
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return {} as Record<string, unknown>;
        }
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          throw new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              message: 'Profile metadata must be valid JSON',
              path: ['profile'],
            },
          ]);
        }
      }
      return {} as Record<string, unknown>;
    })
    .default({}),
});

export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;

export const updateUserSchema = baseUserSchema.extend({
  id: z.string().min(1, 'User id is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
});

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
