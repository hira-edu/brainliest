import { z } from 'zod';

export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // AI
  OPENAI_API_KEY: z.string().startsWith('sk-'),

  // Site Config
  SITE_PRIMARY_DOMAIN: z.string().min(1),
  SITE_ADMIN_DOMAIN: z.string().min(1),

  // Security
  SITE_KMS_MASTER_KEY: z.string().length(64),
  ADMIN_SESSION_HMAC_SECRET: z.string().length(64),
  ADMIN_REMEMBER_DEVICE_HMAC_SECRET: z.string().length(64),

  // Integrations (optional)
  CAPTCHA_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const env: ServerEnv = serverEnvSchema.parse(process.env);
