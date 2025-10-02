export const FEATURE_FLAGS = {
  AI_EXPLANATIONS_ENABLED: {
    key: 'ai_explanations_enabled',
    description: 'Enable AI-powered answer explanations',
    defaultValue: true,
    rolloutType: 'boolean' as const,
  },
  BULK_QUESTION_IMPORT: {
    key: 'bulk_question_import',
    description: 'Allow CSV/JSON question imports',
    defaultValue: false,
    rolloutType: 'boolean' as const,
  },
  FREEMIUM_DAILY_LIMIT: {
    key: 'freemium_daily_limit',
    description: 'Max questions per day for free users',
    defaultValue: 20,
    rolloutType: 'number' as const,
  },
  ADMIN_IP_ALLOWLIST: {
    key: 'admin_ip_allowlist',
    description: 'Restrict admin login to specific IPs',
    defaultValue: false,
    rolloutType: 'boolean' as const,
  },
} as const;

export const featureFlags = FEATURE_FLAGS;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
