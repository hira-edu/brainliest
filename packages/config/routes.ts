export const routes = {
  // Public
  home: () => '/',
  categories: () => '/categories',
  category: (slug: string) => `/categories/${slug}`,
  subjects: () => '/subjects',
  subject: (slug: string) => `/subjects/${slug}`,
  exam: (slug: string) => `/exams/${slug}`,
  practice: (slug: string) => `/practice/${slug}`,
  results: (sessionId: string) => `/results/${sessionId}`,
  search: (query?: string) => (query ? `/search?q=${encodeURIComponent(query)}` : '/search'),

  // Auth
  signIn: () => '/auth/sign-in',
  signUp: () => '/auth/sign-up',
  resetPassword: () => '/auth/reset-password',

  // Account
  account: () => '/account',
  accountSettings: () => '/account/settings',
  accountHistory: () => '/account/history',
  accountBookmarks: () => '/account/bookmarks',

  // Admin
  adminLogin: () => '/login',
  adminDashboard: () => '/dashboard',
  adminQuestions: () => '/questions',
  adminExams: () => '/exams',
  adminUsers: () => '/users',
  adminIntegrations: () => '/integrations',
  adminAuditLog: () => '/audit-logs',
} as const;
