import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// --- Enums -----------------------------------------------------------------

export const categoryTypeEnum = pgEnum('category_type', ['academic', 'professional', 'standardized']);
export const examDifficultyEnum = pgEnum('exam_difficulty', ['EASY', 'MEDIUM', 'HARD', 'EXPERT']);
export const examStatusEnum = pgEnum('exam_status', ['draft', 'published', 'archived']);
export const questionTypeEnum = pgEnum('question_type', ['single', 'multi']);
export const assetTypeEnum = pgEnum('question_asset_type', ['image', 'audio', 'file']);
export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'EDITOR', 'ADMIN', 'SUPERADMIN']);
export const adminRoleEnum = pgEnum('admin_role', ['VIEWER', 'EDITOR', 'ADMIN', 'SUPERADMIN']);
export const integrationEnvironmentEnum = pgEnum('integration_environment', ['production', 'staging', 'development']);
export const integrationKeyTypeEnum = pgEnum('integration_key_type', ['OPENAI', 'STRIPE', 'RESEND', 'CAPTCHA']);
export const actorTypeEnum = pgEnum('audit_actor_type', ['admin', 'user', 'system']);
export const examSessionStatusEnum = pgEnum('exam_session_status', ['in_progress', 'completed', 'abandoned', 'expired']);

// --- Taxonomy --------------------------------------------------------------

export const categories = pgTable(
  'categories',
  {
    slug: varchar('slug', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    type: categoryTypeEnum('type').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const subcategories = pgTable(
  'subcategories',
  {
    slug: varchar('slug', { length: 255 }).primaryKey(),
    categorySlug: varchar('category_slug', { length: 255 })
      .notNull()
      .references(() => categories.slug, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const subjects = pgTable(
  'subjects',
  {
    slug: varchar('slug', { length: 255 }).primaryKey(),
    categorySlug: varchar('category_slug', { length: 255 })
      .notNull()
      .references(() => categories.slug, { onDelete: 'cascade' }),
    subcategorySlug: varchar('subcategory_slug', { length: 255 })
      .references(() => subcategories.slug, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    difficulty: examDifficultyEnum('difficulty'),
    tags: text('tags').array(),
    active: boolean('active').notNull().default(true),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('subjects_category_idx').on(table.categorySlug),
    subcategoryIdx: index('subjects_subcategory_idx').on(table.subcategorySlug),
  })
);

// --- Exams -----------------------------------------------------------------

export const exams = pgTable(
  'exams',
  {
    slug: varchar('slug', { length: 255 }).primaryKey(),
    subjectSlug: varchar('subject_slug', { length: 255 })
      .notNull()
      .references(() => subjects.slug, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes'),
    questionTarget: integer('question_target'),
    difficulty: examDifficultyEnum('difficulty'),
    status: examStatusEnum('status').notNull().default('draft'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    subjectIdx: index('exams_subject_idx').on(table.subjectSlug),
    statusIdx: index('exams_status_idx').on(table.status),
  })
);

// --- Questions & Versions --------------------------------------------------

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    examSlug: varchar('exam_slug', { length: 255 })
      .references(() => exams.slug, { onDelete: 'set null' }),
    subjectSlug: varchar('subject_slug', { length: 255 })
      .notNull()
      .references(() => subjects.slug, { onDelete: 'cascade' }),
    currentVersionId: uuid('current_version_id'),
    type: questionTypeEnum('type').notNull(),
    difficulty: examDifficultyEnum('difficulty').notNull(),
    domain: varchar('domain', { length: 255 }),
    source: varchar('source', { length: 255 }),
    copyright: text('copyright'),
    year: integer('year'),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    examIdx: index('questions_exam_idx').on(table.examSlug),
    subjectIdx: index('questions_subject_idx').on(table.subjectSlug),
  })
);

export const questionVersions = pgTable(
  'question_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    stemMarkdown: text('stem_markdown').notNull(),
    hasKatex: boolean('has_katex').notNull().default(false),
    explanationMarkdown: text('explanation_markdown'),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const choices = pgTable(
  'choices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionVersionId: uuid('question_version_id')
      .notNull()
      .references(() => questionVersions.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 10 }).notNull(),
    contentMarkdown: text('content_markdown').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  }
);

export const questionAssets = pgTable(
  'question_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    type: assetTypeEnum('type').notNull(),
    url: text('url').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
  })
);

export const questionTags = pgTable(
  'question_tags',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ name: 'question_tags_pk', columns: [table.questionId, table.tagId] }),
  })
);

export const questionAiExplanations = pgTable(
  'question_ai_explanations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionVersionId: uuid('question_version_id')
      .notNull()
      .references(() => questionVersions.id, { onDelete: 'cascade' }),
    answerHash: varchar('answer_hash', { length: 255 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    language: varchar('language', { length: 10 }).notNull().default('en'),
    contentMarkdown: text('content_markdown').notNull(),
    tokensTotal: integer('tokens_total').notNull(),
    costCents: integer('cost_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueExplanation: uniqueIndex('question_ai_explanations_unique').on(
      table.questionVersionId,
      table.answerHash,
      table.model,
      table.language
    ),
  })
);

// --- Users & Sessions ------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    hashedPassword: text('hashed_password'),
    role: userRoleEnum('role').notNull().default('STUDENT'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    profile: jsonb('profile').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);

export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    preferences: jsonb('preferences').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').notNull().default('VIEWER'),
    totpSecret: text('totp_secret'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('admin_users_email_idx').on(table.email),
  })
);

export const examSessions = pgTable(
  'exam_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    examSlug: varchar('exam_slug', { length: 255 })
      .notNull()
      .references(() => exams.slug, { onDelete: 'cascade' }),
    status: examSessionStatusEnum('status').notNull().default('in_progress'),
    scorePercent: numeric('score_percent', { precision: 5, scale: 2 }),
    timeSpentSeconds: integer('time_spent_seconds'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  }
);

export const examSessionQuestions = pgTable(
  'exam_session_questions',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => examSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull(),
    selectedAnswers: integer('selected_answers').array(),
    isCorrect: boolean('is_correct'),
    timeSpentSeconds: integer('time_spent_seconds'),
    aiExplanationId: uuid('ai_explanation_id').references(() => questionAiExplanations.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ name: 'exam_session_questions_pk', columns: [table.sessionId, table.questionId] }),
  })
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ name: 'bookmarks_pk', columns: [table.userId, table.questionId] }),
  })
);

export const bans = pgTable(
  'bans',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ name: 'bans_pk', columns: [table.userId, table.adminId] }),
  })
);

// --- Admin & Platform ------------------------------------------------------

export const integrationKeys = pgTable(
  'integration_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    type: integrationKeyTypeEnum('type').notNull(),
    valueEncrypted: text('value_encrypted').notNull(),
    description: text('description'),
    environment: integrationEnvironmentEnum('environment').notNull().default('production'),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    createdByAdmin: uuid('created_by_admin').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const featureFlags = pgTable(
  'feature_flags',
  {
    key: varchar('key', { length: 255 }).primaryKey(),
    description: text('description'),
    enabled: boolean('enabled').notNull().default(false),
    rolloutPercentage: integer('rollout_percentage').default(100),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: actorTypeEnum('actor_type').notNull(),
    actorId: uuid('actor_id'),
    action: varchar('action', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    diff: jsonb('diff').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 500 }).notNull(),
    body: text('body').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    audience: varchar('audience', { length: 50 }).notNull().default('all'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

// --- Relations -------------------------------------------------------------

export const subcategoryRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categorySlug],
    references: [categories.slug],
  }),
}));

export const subjectRelations = relations(subjects, ({ one }) => ({
  category: one(categories, {
    fields: [subjects.categorySlug],
    references: [categories.slug],
  }),
  subcategory: one(subcategories, {
    fields: [subjects.subcategorySlug],
    references: [subcategories.slug],
  }),
}));

export const examRelations = relations(exams, ({ one }) => ({
  subject: one(subjects, {
    fields: [exams.subjectSlug],
    references: [subjects.slug],
  }),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examSlug],
    references: [exams.slug],
  }),
  subject: one(subjects, {
    fields: [questions.subjectSlug],
    references: [subjects.slug],
  }),
  versions: many(questionVersions),
}));

export const questionVersionRelations = relations(questionVersions, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionVersions.questionId],
    references: [questions.id],
  }),
  choices: many(choices),
  explanations: many(questionAiExplanations),
}));

export const choiceRelations = relations(choices, ({ one }) => ({
  version: one(questionVersions, {
    fields: [choices.questionVersionId],
    references: [questionVersions.id],
  }),
}));

export const questionAssetRelations = relations(questionAssets, ({ one }) => ({
  question: one(questions, {
    fields: [questionAssets.questionId],
    references: [questions.id],
  }),
}));

export const questionTagRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, {
    fields: [questionTags.questionId],
    references: [questions.id],
  }),
  tag: one(tags, {
    fields: [questionTags.tagId],
    references: [tags.id],
  }),
}));

export const examSessionRelations = relations(examSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [examSessions.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [examSessions.examSlug],
    references: [exams.slug],
  }),
  questions: many(examSessionQuestions),
}));

export const examSessionQuestionRelations = relations(examSessionQuestions, ({ one }) => ({
  session: one(examSessions, {
    fields: [examSessionQuestions.sessionId],
    references: [examSessions.id],
  }),
  question: one(questions, {
    fields: [examSessionQuestions.questionId],
    references: [questions.id],
  }),
  explanation: one(questionAiExplanations, {
    fields: [examSessionQuestions.aiExplanationId],
    references: [questionAiExplanations.id],
  }),
}));

export const bookmarkRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [bookmarks.questionId],
    references: [questions.id],
  }),
}));

export const banRelations = relations(bans, ({ one }) => ({
  user: one(users, {
    fields: [bans.userId],
    references: [users.id],
  }),
  admin: one(adminUsers, {
    fields: [bans.adminId],
    references: [adminUsers.id],
  }),
}));

export const integrationKeyRelations = relations(integrationKeys, ({ one }) => ({
  createdBy: one(adminUsers, {
    fields: [integrationKeys.createdByAdmin],
    references: [adminUsers.id],
  }),
}));

// --- Type Exports ----------------------------------------------------------

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Subject = InferSelectModel<typeof subjects>;
export type NewSubject = InferInsertModel<typeof subjects>;
export type Exam = InferSelectModel<typeof exams>;
export type NewExam = InferInsertModel<typeof exams>;
export type Question = InferSelectModel<typeof questions>;
export type NewQuestion = InferInsertModel<typeof questions>;
export type QuestionVersion = InferSelectModel<typeof questionVersions>;
export type NewQuestionVersion = InferInsertModel<typeof questionVersions>;
export type Choice = InferSelectModel<typeof choices>;
export type NewChoice = InferInsertModel<typeof choices>;
export type QuestionAsset = InferSelectModel<typeof questionAssets>;
export type NewQuestionAsset = InferInsertModel<typeof questionAssets>;
export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;
export type QuestionAiExplanation = InferSelectModel<typeof questionAiExplanations>;
export type NewQuestionAiExplanation = InferInsertModel<typeof questionAiExplanations>;
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;
export type ExamSession = InferSelectModel<typeof examSessions>;
export type NewExamSession = InferInsertModel<typeof examSessions>;
export type ExamSessionQuestion = InferSelectModel<typeof examSessionQuestions>;
export type NewExamSessionQuestion = InferInsertModel<typeof examSessionQuestions>;
export type Bookmark = InferSelectModel<typeof bookmarks>;
export type NewBookmark = InferInsertModel<typeof bookmarks>;
export type Ban = InferSelectModel<typeof bans>;
export type NewBan = InferInsertModel<typeof bans>;
export type IntegrationKey = InferSelectModel<typeof integrationKeys>;
export type NewIntegrationKey = InferInsertModel<typeof integrationKeys>;
export type FeatureFlag = InferSelectModel<typeof featureFlags>;
export type NewFeatureFlag = InferInsertModel<typeof featureFlags>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type Announcement = InferSelectModel<typeof announcements>;
export type NewAnnouncement = InferInsertModel<typeof announcements>;
