import { z } from 'zod';

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().default('Brainliest'),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
