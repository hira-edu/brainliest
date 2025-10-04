export const redisKeys = {
  // Caches
  categoryTree: () => 'cache:category-tree:v1',
  examMeta: (slug: string) => `cache:exam:meta:${slug}`,
  question: (id: string, version: number) => `cache:question:${id}:v${version}`,
  searchSuggest: (prefix: string) => `cache:search:suggest:${prefix}`,

  // AI Explanations
  aiExplanation: (questionId: string, answerHash: string, model: string, lang: string) =>
    `ai:explanation:${questionId}:${answerHash}:${model}:${lang}`,

  // Rate Limits
  rateLimitAi: (identifier: string) => `ratelimit:ai:${identifier}`,
  rateLimitAuth: (ip: string) => `ratelimit:auth:${ip}`,
  rateLimitAuthEmail: (email: string) => `ratelimit:auth:email:${email}`,
  rateLimitAuthCredential: (email: string, ip: string) => `ratelimit:auth:credential:${email}:${ip}`,
  rateLimitSearch: (ip: string) => `ratelimit:search:${ip}`,

  // Sessions
  adminSession: (sessionId: string) => `session:admin:${sessionId}`,
  adminTotpChallenge: (challengeId: string) => `auth:totp:challenge:${challengeId}`,

  // Locks
  lockImport: (importId: string) => `lock:import:${importId}`,

  // Queues
  queue: (name: string) => `queue:${name}`,
} as const;

export const REDIS_TTL = {
  AI_EXPLANATION: 60 * 60 * 24 * 7, // 7 days
  EXAM_META: 60 * 60 * 6, // 6 hours
  QUESTION: 60 * 60 * 6, // 6 hours
  CATEGORY_TREE: 60 * 60 * 12, // 12 hours
  SEARCH_SUGGEST: 60 * 60 * 24, // 24 hours
  ADMIN_SESSION: 60 * 60 * 8, // 8 hours
  RATE_LIMIT_WINDOW: 60 * 60, // 1 hour
  IMPORT_LOCK: 60 * 5, // 5 minutes
} as const;
