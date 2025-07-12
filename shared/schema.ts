import { pgTable, text, serial, integer, boolean, timestamp, index, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Fixed: Define difficulty enum for type safety and constraint enforcement
export const difficultyEnum = pgEnum("difficulty", ["Beginner", "Intermediate", "Advanced", "Expert"]);

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  export const severityLevels = pgEnum('severity_levels', ['debug', 'info', 'warning', 'error', 'critical']);
  export const permissionTypes = pgEnum('permission_types', ['read', 'write', 'delete', 'admin', 'create', 'update']);
  export const retentionActions = pgEnum('retention_actions', ['soft_delete', 'hard_delete', 'archive', 'anonymize']);

  // Tables
  export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxCategoriesSlug: index('idx_categories_slug').on(table.slug),
  }));

  export const subcategories = pgTable('subcategories', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    categorySlug: text('category_slug').references(() => categories.slug, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    keywords: text('keywords').array().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxSubcategoriesSlug: index('idx_subcategories_slug').on(table.slug),
    idxSubcategoriesCategorySlug: index('idx_subcategories_category_slug').on(table.categorySlug),
  }));

  export const accessAudit = pgTable('access_audit', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    resourceType: text('resource_type').notNull(),
    resourceId: integer('resource_id'),
    action: text('action').notNull(),
    permissionGranted: boolean('permission_granted').notNull(),
    denialReason: text('denial_reason'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    sessionId: text('session_id'),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxAccessAuditResourceAction: index('idx_access_audit_resource_action').on(table.resourceType, table.action, table.permissionGranted),
    idxAccessAuditUserTimestamp: index('idx_access_audit_user_timestamp').on(table.userId, table.timestamp),
  }));

  export const accessPermissions = pgTable('access_permissions', {
    id: serial('id').primaryKey(),
    roleName: text('role_name').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: integer('resource_id'),
    permissionType: permissionTypes('permission_type').notNull(),
    grantedBy: integer('granted_by').references(() => users.id),
    grantedAt: timestamp('granted_at', { withTimezone: false }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    isActive: boolean('is_active').default(true),
    conditions: jsonb('conditions'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxAccessPermissionsActive: index('idx_access_permissions_active').on(table.isActive, table.expiresAt),
    idxAccessPermissionsRoleResource: index('idx_access_permissions_role_resource').on(table.roleName, table.resourceType),
  }));

  export const anonQuestionSessions = pgTable('anon_question_sessions', {
    id: serial('id').primaryKey(),
    ipAddress: text('ip_address').notNull(),
    sessionData: jsonb('session_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
  });

  export const apiUsageLogs = pgTable('api_usage_logs', {
    id: serial('id').primaryKey(),
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    statusCode: integer('status_code').notNull(),
    responseTimeMs: integer('response_time_ms'),
    userId: integer('user_id').references(() => users.id),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    requestSizeBytes: integer('request_size_bytes'),
    responseSizeBytes: integer('response_size_bytes'),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxApiUsageEndpointTimestamp: index('idx_api_usage_endpoint_timestamp').on(table.endpoint, table.timestamp),
    idxApiUsageStatusCode: index('idx_api_usage_status_code').on(table.statusCode),
    idxApiUsageUserTimestamp: index('idx_api_usage_user_timestamp').on(table.userId, table.timestamp),
  }));

  export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    action: text('action').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxAuditLogsUserId: index('idx_audit_logs_user_id').on(table.userId),
  }));

  export const auditLogsPartitioned = pgTable('audit_logs_partitioned', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    action: text('action').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow().notNull(),
  }, (table) => ({
    auditLogsPartitionedPkey: primaryKey({ columns: [table.id, table.timestamp], name: 'audit_logs_partitioned_pkey' }),
  }));

  export const authLogs = pgTable('auth_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    eventType: text('event_type').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
  });

  export const authSessions = pgTable('auth_sessions', {
    sessionToken: text('session_token').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expires: timestamp('expires', { withTimezone: false, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxAuthSessionsUserId: index('idx_auth_sessions_user_id').on(table.userId),
    idxAuthSessionsExpires: index('idx_auth_sessions_expires').on(table.expires),
  }));

  export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    commentText: text('comment_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxCommentsQuestionId: index('idx_comments_question_id').on(table.questionId),
    idxCommentsUserId: index('idx_comments_user_id').on(table.userId),
  }));

  export const dailyTrendingSnapshot = pgTable('daily_trending_snapshot', {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    snapshot: jsonb('snapshot').notNull(),
  }, (table) => ({
    idxDailyTrendingSnapshotDate: index('idx_daily_trending_snapshot_date').on(table.date),
  }));

  export const dataRetentionPolicies = pgTable('data_retention_policies', {
    id: serial('id').primaryKey(),
    policyName: text('policy_name').notNull().unique(),
    description: text('description').notNull(),
    retentionPeriodMonths: integer('retention_period_months').notNull(),
    tableName: text('table_name').notNull(),
    criteria: jsonb('criteria'),
    actionOnExpiry: retentionActions('action_on_expiry').default('soft_delete'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxDataRetentionPoliciesActive: index('idx_data_retention_policies_active').on(table.isActive, table.tableName),
  }));

  export const detailedAnswers = pgTable('detailed_answers', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => userSessions.id, { onDelete: 'cascade' }),
    questionId: integer('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    userAnswer: text('user_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    difficulty: text('difficulty'),
    domain: text('domain'),
    answeredAt: timestamp('answered_at', { withTimezone: false }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxDetailedAnswersAnsweredAt: index('idx_detailed_answers_answered_at').on(table.answeredAt),
    idxDetailedAnswersComprehensive: index('idx_detailed_answers_comprehensive').on(table.sessionId, table.isCorrect, table.difficulty, table.domain),
    idxDetailedAnswersDifficulty: index('idx_detailed_answers_difficulty').on(table.difficulty),
    idxDetailedAnswersDomain: index('idx_detailed_answers_domain').on(table.domain),
    idxDetailedAnswersQuestionId: index('idx_detailed_answers_question_id').on(table.questionId),
    idxDetailedAnswersSessionCorrect: index('idx_detailed_answers_session_correct').on(table.sessionId, table.isCorrect),
    idxDetailedAnswersSessionId: index('idx_detailed_answers_session_id').on(table.sessionId),
  }));

  export const examAnalytics = pgTable('exam_analytics', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => userSessions.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id).notNull(),
    examId: integer('exam_id').references(() => exams.id).notNull(),
    score: numeric('score', { precision: 5, scale: 2 }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: false }).defaultNow(),
    analysisDate: date('analysis_date'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxExamAnalyticsCompletedAt: index('idx_exam_analytics_completed_at').on(table.completedAt),
    idxExamAnalyticsExamId: index('idx_exam_analytics_exam_id').on(table.examId),
    idxExamAnalyticsPerformance: index('idx_exam_analytics_performance').on(table.userId, table.examId, table.completedAt),
    idxExamAnalyticsUserExam: index('idx_exam_analytics_user_exam').on(table.userId, table.examId),
    idxExamAnalyticsUserId: index('idx_exam_analytics_user_id').on(table.userId),
  }));

  export const exams = pgTable('exams', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    questionCount: integer('question_count').notNull(),
    duration: integer('duration'),
    difficulty: text('difficulty').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxExamsIsActive: index('idx_exams_is_active').on(table.isActive),
    idxExamsSubjectActive: index('idx_exams_subject_active').on(table.subjectId, table.isActive),
    idxExamsSubjectId: index('idx_exams_subject_id').on(table.subjectId),
  }));

  export const performanceMetrics = pgTable('performance_metrics', {
    id: serial('id').primaryKey(),
    metricName: text('metric_name').notNull(),
    metricValue: numeric('metric_value', { precision: 10, scale: 2 }).notNull(),
    metricUnit: text('metric_unit'),
    component: text('component').notNull(),
    environment: text('environment').default('production'),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
    metadata: jsonb('metadata'),
  }, (table) => ({
    idxPerformanceMetricsComponent: index('idx_performance_metrics_component').on(table.component),
    idxPerformanceMetricsNameTimestamp: index('idx_performance_metrics_name_timestamp').on(table.metricName, table.timestamp),
  }));

  export const performanceTrends = pgTable('performance_trends', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id),
    trendData: jsonb('trend_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxPerformanceTrendsUserSubject: index('idx_performance_trends_user_subject').on(table.userId, table.subjectId),
  }));

  export const questionAnalytics = pgTable('question_analytics', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id').references(() => questions.id),
    totalAttempts: integer('total_attempts').default(0),
    correctAttempts: integer('correct_attempts').default(0),
    accuracyRate: numeric('accuracy_rate', { precision: 5, scale: 2 }).default(0),
    averageTimeSeconds: numeric('average_time_seconds', { precision: 8, scale: 2 }),
    skipRate: numeric('skip_rate', { precision: 5, scale: 2 }).default(0),
    hintUsageRate: numeric('hint_usage_rate', { precision: 5, scale: 2 }).default(0),
    lastUpdated: timestamp('last_updated', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxQuestionAnalyticsQuestionId: index('idx_question_analytics_question_id').on(table.questionId),
  }));

  export const questions = pgTable('questions', {
    id: serial('id').primaryKey(),
    examId: integer('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    questionText: text('question_text').notNull(),
    options: jsonb('options').notNull(),
    correctAnswer: text('correct_answer').notNull(),
    difficulty: text('difficulty'),
    domain: text('domain'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
    searchVector: tsvector('search_vector'),
  }, (table) => ({
    idxQuestionsDifficulty: index('idx_questions_difficulty').on(table.difficulty),
    idxQuestionsDomain: index('idx_questions_domain').on(table.domain),
    idxQuestionsExamDifficulty: index('idx_questions_exam_difficulty').on(table.examId, table.difficulty),
    idxQuestionsExamId: index('idx_questions_exam_id').on(table.examId),
    idxQuestionsSearchVector: index('idx_questions_search_vector').on(table.searchVector).using('gin'),
    idxQuestionsSubjectDomain: index('idx_questions_subject_domain').on(table.subjectId, table.domain),
    idxQuestionsSubjectId: index('idx_questions_subject_id').on(table.subjectId),
  }));

  export const studyRecommendations = pgTable('study_recommendations', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    recommendation: jsonb('recommendation').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  });

  export const subjectPopularity = pgTable('subject_popularity', {
    id: serial('id').primaryKey(),
    subjectId: integer('subject_id').references(() => subjects.id),
    date: date('date').notNull(),
    viewCount: integer('view_count').default(0),
    examStarts: integer('exam_starts').default(0),
    examCompletions: integer('exam_completions').default(0),
    uniqueUsers: integer('unique_users').default(0),
    avgSessionDuration: integer('avg_session_duration').default(0),
    bounceRate: numeric('bounce_rate', { precision: 5, scale: 2 }).default(0),
  }, (table) => ({
    idxSubjectPopularitySubjectDate: index('idx_subject_popularity_subject_date').on(table.subjectId, table.date),
  }));

  export const subjectTrendingStats = pgTable('subject_trending_stats', {
    id: serial('id').primaryKey(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    trendingScore: integer('trending_score').notNull(),
    date: date('date').default(sql`CURRENT_DATE`),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxTrendingStatsSubjectDate: index('idx_trending_stats_subject_date').on(table.subjectId, table.date),
  }));

  export const subjects = pgTable('subjects', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    color: text('color'),
    categorySlug: text('category_slug').references(() => categories.slug, { onDelete: 'set null' }),
    subcategorySlug: text('subcategory_slug').references(() => subcategories.slug, { onDelete: 'set null' }),
    examCount: integer('exam_count').default(0),
    questionCount: integer('question_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
    searchVector: tsvector('search_vector'),
  }, (table) => ({
    idxSubjectsCategorySlug: index('idx_subjects_category_slug').on(table.categorySlug),
    idxSubjectsSearchVector: index('idx_subjects_search_vector').on(table.searchVector).using('gin'),
    idxSubjectsSubcategorySlug: index('idx_subjects_subcategory_slug').on(table.subcategorySlug),
  }));

  export const systemEvents = pgTable('system_events', {
    id: serial('id').primaryKey(),
    eventType: text('event_type').notNull(),
    eventCategory: text('event_category').notNull(),
    severityLevel: severityLevels('severity_level').default('info'),
    userId: integer('user_id').references(() => users.id),
    sessionId: text('session_id'),
    resourceType: text('resource_type'),
    resourceId: integer('resource_id'),
    eventData: jsonb('event_data'),
    message: text('message'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
    processed: boolean('processed').default(false),
  }, (table) => ({
    idxSystemEventsSeverity: index('idx_system_events_severity').on(table.severityLevel),
    idxSystemEventsTimestamp: index('idx_system_events_timestamp').on(table.timestamp),
    idxSystemEventsTypeCategory: index('idx_system_events_type_category').on(table.eventType, table.eventCategory),
    idxSystemEventsUserId: index('idx_system_events_user_id').on(table.userId),
  }));

  export const uploads = pgTable('uploads', {
    id: serial('id').primaryKey(),
    fileName: text('file_name').notNull(),
    originalName: text('original_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    fileType: text('file_type').notNull(),
    uploadPath: text('upload_path').notNull(),
    uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  });

  export const userLearningPaths = pgTable('user_learning_paths', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    subjectId: integer('subject_id').references(() => subjects.id),
    pathType: text('path_type').notNull(),
    currentStep: integer('current_step').default(1),
    totalSteps: integer('total_steps').notNull(),
    completionPercentage: numeric('completion_percentage', { precision: 5, scale: 2 }).default(0),
    estimatedCompletionTime: integer('estimated_completion_time'),
    difficultyPreference: text('difficulty_preference'),
    learningStyle: text('learning_style'),
    pathData: jsonb('path_data'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: false }),
  }, (table) => ({
    idxUserLearningPathsUserSubject: index('idx_user_learning_paths_user_subject').on(table.userId, table.subjectId),
  }));

  export const userProfiles = pgTable('user_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    username: text('username').notNull(),
    bio: text('bio'),
    location: text('location'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  });

  export const userSessions = pgTable('user_sessions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    examId: integer('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
    sessionData: jsonb('session_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxUserSessionsExamId: index('idx_user_sessions_exam_id').on(table.examId),
  }));

  export const userSubjectInteractions = pgTable('user_subject_interactions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    interactionType: text('interaction_type').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: false }).defaultNow(),
  }, (table) => ({
    idxUserInteractionsSubjectType: index('idx_user_interactions_subject_type').on(table.subjectId, table.interactionType),
    idxUserInteractionsTimestamp: index('idx_user_interactions_timestamp').on(table.timestamp),
  }));

  export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    firstName: text('first_name').default('').notNull(),
    lastName: text('last_name').default('').notNull(),
    profileImage: text('profile_image').default('').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isBanned: boolean('is_banned').default(false).notNull(),
    banReason: text('ban_reason').default('').notNull(),
    role: userRoles('role').default('user').notNull(),
    passwordHash: text('password_hash'),
    emailVerified: boolean('email_verified').default(false).notNull(),
    emailVerificationToken: text('email_verification_token'),
    emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: false }),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: timestamp('password_reset_expires', { withTimezone: false }),
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: false }),
    loginCount: integer('login_count').default(0),
    lastLoginAt: timestamp('last_login_at', { withTimezone: false }),
    lastLoginIp: text('last_login_ip').default('').notNull(),
    registrationIp: text('registration_ip').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
    metadata: jsonb('metadata').default('{}').notNull(),
    passwordHashEncrypted: boolean('password_hash_encrypted').default(false),
    emailVerificationTokenEncrypted: boolean('email_verification_token_encrypted').default(false),
    passwordResetTokenEncrypted: boolean('password_reset_token_encrypted').default(false),
    twoFactorSecretEncrypted: boolean('two_factor_secret_encrypted').default(false),
    metadataEncrypted: boolean('metadata_encrypted').default(false),
    dataClassification: dataClassifications('data_classification').default('sensitive'),
    piiFields: text('pii_fields').array().default(sql`ARRAY['email', 'first_name', 'last_name', 'profile_image']`),
    retentionDate: date('retention_date'),
    dataRetentionPolicy: text('data_retention_policy').default('user_data_7_years'),
    twoFactorSecret: text('two_factor_secret'),
  }, (table) => ({
    idxUsersDataClassification: index('idx_users_data_classification').on(table.dataClassification),
    idxUsersIsActive: index('idx_users_is_active').on(table.isActive),
    idxUsersIsBanned: index('idx_users_is_banned').on(table.isBanned),
    idxUsersRetentionDate: index('idx_users_retention_date').on(table.retentionDate).where(sql`${table.retentionDate} IS NOT NULL`),
  }));

  // Insert Schemas
  export const insertCategorySchema = createInsertSchema(categories);
  export const insertSubcategorySchema = createInsertSchema(subcategories);

  // Relations
  export const categoriesRelations = relations(categories, ({ many }) => ({
    subcategories: many(subcategories),
    subjects: many(subjects),
  }));

  export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
    category: one(categories, {
      fields: [subcategories.categorySlug],
      references: [categories.slug],
    }),
    subjects: many(subjects),
  }));

  export const accessAuditRelations = relations(accessAudit, ({ one }) => ({
    user: one(users, {
      fields: [accessAudit.userId],
      references: [users.id],
    }),
  }));

  export const accessPermissionsRelations = relations(accessPermissions, ({ one }) => ({
    grantedByUser: one(users, {
      fields: [accessPermissions.grantedBy],
      references: [users.id],
    }),
  }));

  export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
    user: one(users, {
      fields: [apiUsageLogs.userId],
      references: [users.id],
    }),
  }));

  export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
      fields: [auditLogs.userId],
      references: [users.id],
    }),
  }));

  export const auditLogsPartitionedRelations = relations(auditLogsPartitioned, ({ one }) => ({
    user: one(users, {
      fields: [auditLogsPartitioned.userId],
      references: [users.id],
    }),
  }));

  export const authLogsRelations = relations(authLogs, ({ one }) => ({
    user: one(users, {
      fields: [authLogs.userId],
      references: [users.id],
    }),
  }));

  export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(users, {
      fields: [authSessions.userId],
      references: [users.id],
    }),
  }));

  export const commentsRelations = relations(comments, ({ one }) => ({
    question: one(questions, {
      fields: [comments.questionId],
      references: [questions.id],
    }),
    user: one(users, {
      fields: [comments.userId],
      references: [users.id],
    }),
  }));

  export const detailedAnswersRelations = relations(detailedAnswers, ({ one }) => ({
    session: one(userSessions, {
      fields: [detailedAnswers.sessionId],
      references: [userSessions.id],
    }),
    question: one(questions, {
      fields: [detailedAnswers.questionId],
      references: [questions.id],
    }),
  }));

  export const examAnalyticsRelations = relations(examAnalytics, ({ one }) => ({
    session: one(userSessions, {
      fields: [examAnalytics.sessionId],
      references: [userSessions.id],
    }),
    user: one(users, {
      fields: [examAnalytics.userId],
      references: [users.id],
    }),
    exam: one(exams, {
      fields: [examAnalytics.examId],
      references: [exams.id],
    }),
  }));

  export const examsRelations = relations(exams, ({ one, many }) => ({
    subject: one(subjects, {
      fields: [exams.subjectId],
      references: [subjects.id],
    }),
    questions: many(questions),
    userSessions: many(userSessions),
  }));

  export const performanceTrendsRelations = relations(performanceTrends, ({ one }) => ({
    user: one(users, {
      fields: [performanceTrends.userId],
      references: [users.id],
    }),
    subject: one(subjects, {
      fields: [performanceTrends.subjectId],
      references: [subjects.id],
    }),
  }));

  export const questionAnalyticsRelations = relations(questionAnalytics, ({ one }) => ({
    question: one(questions, {
      fields: [questionAnalytics.questionId],
      references: [questions.id],
    }),
  }));

  export const questionsRelations = relations(questions, ({ one, many }) => ({
    exam: one(exams, {
      fields: [questions.examId],
      references: [exams.id],
    }),
    subject: one(subjects, {
      fields: [questions.subjectId],
      references: [subjects.id],
    }),
    comments: many(comments),
    detailedAnswers: many(detailedAnswers),
  }));

  export const studyRecommendationsRelations = relations(studyRecommendations, ({ one }) => ({
    user: one(users, {
      fields: [studyRecommendations.userId],
      references: [users.id],
    }),
  }));

  export const subjectPopularityRelations = relations(subjectPopularity, ({ one }) => ({
    subject: one(subjects, {
      fields: [subjectPopularity.subjectId],
      references: [subjects.id],
    }),
  }));

  export const subjectTrendingStatsRelations = relations(subjectTrendingStats, ({ one }) => ({
    subject: one(subjects, {
      fields: [subjectTrendingStats.subjectId],
      references: [subjects.id],
    }),
  }));

  export const subjectsRelations = relations(subjects, ({ one, many }) => ({
    category: one(categories, {
      fields: [subjects.categorySlug],
      references: [categories.slug],
    }),
    subcategory: one(subcategories, {
      fields: [subjects.subcategorySlug],
      references: [subcategories.slug],
    }),
    exams: many(exams),
    questions: many(questions),
    performanceTrends: many(performanceTrends),
    subjectPopularity: many(subjectPopularity),
    subjectTrendingStats: many(subjectTrendingStats),
    userLearningPaths: many(userLearningPaths),
    userSubjectInteractions: many(userSubjectInteractions),
  }));

  export const systemEventsRelations = relations(systemEvents, ({ one }) => ({
    user: one(users, {
      fields: [systemEvents.userId],
      references: [users.id],
    }),
  }));

  export const uploadsRelations = relations(uploads, ({ one }) => ({
    uploadedByUser: one(users, {
      fields: [uploads.uploadedBy],
      references: [users.id],
    }),
  }));

  export const userLearningPathsRelations = relations(userLearningPaths, ({ one }) => ({
    user: one(users, {
      fields: [userLearningPaths.userId],
      references: [users.id],
    }),
    subject: one(subjects, {
      fields: [userLearningPaths.subjectId],
      references: [subjects.id],
    }),
  }));

  export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    user: one(users, {
      fields: [userProfiles.userId],
      references: [users.id],
    }),
  }));

  export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
    user: one(users, {
      fields: [userSessions.userId],
      references: [users.id],
    }),
    exam: one(exams, {
      fields: [userSessions.examId],
      references: [exams.id],
    }),
    detailedAnswers: many(detailedAnswers),
    examAnalytics: many(examAnalytics),
  }));

  export const userSubjectInteractionsRelations = relations(userSubjectInteractions, ({ one }) => ({
    user: one(users, {
      fields: [userSubjectInteractions.userId],
      references: [users.id],
    }),
    subject: one(subjects, {
      fields: [userSubjectInteractions.subjectId],
      references: [subjects.id],
    }),
  }));

  export const usersRelations = relations(users, ({ many }) => ({
    accessAudit: many(accessAudit),
    accessPermissionsGranted: many(accessPermissions, { relationName: 'grantedBy' }),
    apiUsageLogs: many(apiUsageLogs),
    auditLogs: many(auditLogs),
    auditLogsPartitioned: many(auditLogsPartitioned),
    authLogs: many(authLogs),
    authSessions: many(authSessions),
    comments: many(comments),
    examAnalytics: many(examAnalytics),
    performanceTrends: many(performanceTrends),
    studyRecommendations: many(studyRecommendations),
    systemEvents: many(systemEvents),
    uploads: many(uploads),
    userLearningPaths: many(userLearningPaths),
    userProfiles: many(userProfiles),
    userSessions: many(userSessions),
    userSubjectInteractions: many(userSubjectInteractions),
  }));

  export const insertUploadSchema = z.object({
    fileName: z.string().min(1),
    originalName: z.string().min(1),
    fileSize: z.number().int().nonnegative(),
    mimeType: z.string().min(1),
    fileType: z.string().min(1),
    uploadPath: z.string().min(1),
    uploadedBy: z.number().min(1),
    isActive: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subcategories = pgTable("subcategories", {
  slug: text("slug").primaryKey(),
  categorySlug: text("category_slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  categorySlug: text("category_slug"),
  subcategorySlug: text("subcategory_slug"),
  examCount: integer("exam_count").default(0),
  questionCount: integer("question_count").default(0),
});

export const exams = pgTable("exams", {
  slug: text("slug").primaryKey(),
  subjectSlug: text("subject_slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  questionCount: integer("question_count").notNull(),
  duration: integer("duration"), // in minutes
  // Fixed: Use difficulty enum for type safety and constraint enforcement
  difficulty: difficultyEnum("difficulty").notNull(),
  isActive: boolean("is_active").default(true),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  text: text("text").notNull(),
  options: text("options").array().notNull(), // Array of option texts
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based) or multiple if multipleCorrect is true
  correctAnswers: integer("correct_answers").array(), // Array of correct answer indexes for multiple-choice
  allowMultipleAnswers: boolean("allow_multiple_answers").default(false), // Whether question allows multiple selections
  explanation: text("explanation"),
  domain: text("domain"), // For PMP: 'Initiating', 'Planning', etc.
  // Fixed: Use difficulty enum for type safety and constraint enforcement
  difficulty: difficultyEnum("difficulty").notNull(),
  order: integer("order").default(0),
});

export const examSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull(),
  userName: text("user_name"), // Add userName field for compatibility
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  currentQuestionIndex: integer("current_question_index").default(0),
  answers: text("answers").array().default([]), // Array of user answers
  score: integer("score"),
  timeSpent: integer("time_spent"), // in seconds
  isCompleted: boolean("is_completed").default(false),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  parentId: integer("parent_id"), // For nested replies
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
});

// Admin uploads table for managing icon files and assets
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileType: text("file_type").notNull(), // 'icon', 'image', 'document'
  uploadPath: text("upload_path").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define user roles as an enum for type safety and constraint enforcement
export const userRoles = pgEnum("user_roles", ["user", "admin", "moderator"]);

// IP-based freemium session tracking table
export const anonQuestionSessions = pgTable("anon_question_sessions", {
  id: serial("id").primaryKey(),
  // Store normalized IP addresses; allow multiple entries per IP for different UAs
  ipAddress: text("ip_address").notNull(),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  // Time-zone aware timestamp for last reset of question count
  lastReset: timestamp("last_reset").notNull().defaultNow(),
  userAgentHash: text("user_agent_hash").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});



// Users table with audit fields, role enum, and JSONB metadata
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  profileImage: text("profile_image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason").notNull().default(""),
  // Enforced enum for roles prevents typos and invalid roles
  role: userRoles("role").notNull().default("user"),
  
  // Authentication fields
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Security fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  loginCount: integer("login_count").default(0),
  
  // Tracking fields
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip").notNull().default(""),
  registrationIp: text("registration_ip").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Store arbitrary JSON metadata in a native JSONB column
  metadata: jsonb("metadata").notNull().default("{}"),
});



// Audit logging table for enterprise compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(), // e.g., "POST /api/subjects", "DELETE /api/questions/123"
  resourceType: text("resource_type"), // 'subject', 'exam', 'question', 'user'
  resourceId: integer("resource_id"), // ID of affected resource
  // Fixed: Use JSONB for changes instead of text for native JSON querying
  changes: jsonb("changes").default("{}"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
});

// Analytics and Performance Tracking Tables
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull().unique(),
  email: text("email"),
  totalExamsTaken: integer("total_exams_taken").default(0),
  totalQuestionsAnswered: integer("total_questions_answered").default(0),
  // Fixed: Use numeric type for average score instead of text
  averageScore: numeric("average_score", { precision: 5, scale: 2 }).default("0"),
  // Fixed: Use JSONB for strongest subjects instead of text
  strongestSubjects: jsonb("strongest_subjects").default("[]"),
  // Fixed: Use JSONB for weakest subjects instead of text
  weakestSubjects: jsonb("weakest_subjects").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const detailedAnswers = pgTable("detailed_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  userAnswer: integer("user_answer").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  difficulty: text("difficulty"), // easy, medium, hard
  domain: text("domain"), // question domain/category
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const examAnalytics = pgTable("exam_analytics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  examSlug: text("exam_slug").notNull(),
  userName: text("user_name").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  // Fixed: Use numeric type for score instead of text for better querying
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  timeSpent: integer("time_spent"), // in seconds
  // Fixed: Use numeric type for completion rate instead of text
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }),
  // Fixed: Use JSONB for domain scores instead of text for native JSON querying
  domainScores: jsonb("domain_scores").default("{}"),
  // Fixed: Use JSONB for difficulty breakdown instead of text
  difficultyBreakdown: jsonb("difficulty_breakdown").default("{}"),
  // Fixed: Use JSONB for streak data instead of text
  streakData: jsonb("streak_data").default("{}"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const performanceTrends = pgTable("performance_trends", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  week: text("week").notNull(), // Start of week (YYYY-MM-DD format)
  examsTaken: integer("exams_taken").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  // Fixed: Use numeric type for average score instead of text
  averageScore: numeric("average_score", { precision: 5, scale: 2 }),
  // Fixed: Use numeric type for accuracy trend instead of text
  accuracyTrend: numeric("accuracy_trend", { precision: 5, scale: 2 }),
  // Fixed: Use numeric type for speed trend instead of text
  speedTrend: numeric("speed_trend", { precision: 5, scale: 2 }),
  // Fixed: Use JSONB for strong domains instead of text
  strongDomains: jsonb("strong_domains").default("[]"),
  // Fixed: Use JSONB for weak domains instead of text
  weakDomains: jsonb("weak_domains").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyRecommendations = pgTable("study_recommendations", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  recommendationType: text("recommendation_type").notNull(), // "focus_area", "review", "strength"
  content: text("content").notNull(),
  priority: integer("priority").default(1), // 1-5 scale
  // Fixed: Use JSONB for domains instead of text
  domains: jsonb("domains").default("[]"),
  // Fixed: Use numeric type for estimated impact instead of text
  estimatedImpact: numeric("estimated_impact", { precision: 5, scale: 2 }),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Authentication Audit Logging
export const authLogs = pgTable("auth_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  email: text("email"),
  action: text("action").notNull(), // login_success, login_failed, register, logout, password_reset, etc.
  method: text("method"), // email, google, facebook, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  // Fixed: Use JSONB for metadata instead of text for native JSON querying
  metadata: jsonb("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session Management for JWT tokens
export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").unique().notNull(),
  refreshToken: text("refresh_token").unique(),
  isActive: boolean("is_active").default(true),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

// User interaction tracking tables for trending calculations
export const userSubjectInteractions = pgTable("user_subject_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // nullable for anonymous users
  subjectSlug: text("subject_slug").notNull(),
  sessionId: text("session_id"), // for anonymous tracking
  interactionType: text("interaction_type").notNull(), // 'view', 'search', 'click', 'exam_start', 'exam_complete'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const subjectTrendingStats = pgTable("subject_trending_stats", {
  id: serial("id").primaryKey(),
  subjectSlug: text("subject_slug").notNull(),
  date: timestamp("date").notNull(),
  viewCount: integer("view_count").default(0),
  searchCount: integer("search_count").default(0),
  clickCount: integer("click_count").default(0),
  examStartCount: integer("exam_start_count").default(0),
  examCompleteCount: integer("exam_complete_count").default(0),
  trendingScore: integer("trending_score").default(0),
  // Fixed: Use numeric type for growth percentage instead of text
  growthPercentage: numeric("growth_percentage", { precision: 5, scale: 2 }).default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const dailyTrendingSnapshot = pgTable("daily_trending_snapshot", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  // Fixed: Use JSONB for top subjects instead of text
  topSubjects: jsonb("top_subjects").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fixed: Indexes will be added via migrations - keeping schema simple for now

export const insertCategorySchema = createInsertSchema(categories, {
  createdAt: undefined,
});

export const insertSubcategorySchema = createInsertSchema(subcategories, {
  createdAt: undefined,
});

export const insertSubjectSchema = createInsertSchema(subjects, {
  examCount: undefined,
  questionCount: undefined,
});

export const insertExamSchema = createInsertSchema(exams);

export const insertQuestionSchema = createInsertSchema(questions, {
  id: undefined,
});
// Fixed: Removed .refine() validation to restore .extend() functionality
// Validation will be handled in admin components separately

export const insertExamSessionSchema = createInsertSchema(examSessions, {
  id: undefined,
  startedAt: undefined,
  completedAt: undefined,
});
// Fixed: Removed forced optional override - userName should follow table schema nullability

export const insertCommentSchema = createInsertSchema(comments, {
  id: undefined,
  createdAt: undefined,
});

export const insertUserSchema = createInsertSchema(users, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  emailVerificationToken: undefined,
  emailVerificationExpires: undefined,
  passwordResetToken: undefined,
  passwordResetExpires: undefined,
  failedLoginAttempts: undefined,
  lockedUntil: undefined,
  loginCount: undefined,
  lastLoginAt: undefined,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  id: undefined,
  createdAt: undefined,
  lastActiveAt: undefined,
});

export const insertDetailedAnswerSchema = createInsertSchema(detailedAnswers, {
  id: undefined,
  answeredAt: undefined,
});

export const insertExamAnalyticsSchema = createInsertSchema(examAnalytics, {
  id: undefined,
  completedAt: undefined,
});

export const insertPerformanceTrendsSchema = createInsertSchema(performanceTrends, {
  id: undefined,
  createdAt: undefined,
});

export const insertStudyRecommendationsSchema = createInsertSchema(studyRecommendations, {
  id: undefined,
  createdAt: undefined,
});

export const insertAuthLogSchema = createInsertSchema(authLogs, {
  id: undefined,
  createdAt: undefined,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions, {
  id: undefined,
  createdAt: undefined,
  lastUsedAt: undefined,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  id: undefined,
  timestamp: undefined,
});

export const insertUserSubjectInteractionSchema = createInsertSchema(userSubjectInteractions, {
  id: undefined,
  timestamp: undefined,
});

export const insertSubjectTrendingStatsSchema = createInsertSchema(subjectTrendingStats, {
  id: undefined,
  lastUpdated: undefined,
});

export const insertDailyTrendingSnapshotSchema = createInsertSchema(dailyTrendingSnapshot, {
  id: undefined,
  createdAt: undefined,
});

export const insertAnonQuestionSessionSchema = createInsertSchema(anonQuestionSessions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertUploadSchema = createInsertSchema(uploads, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Authentication Types
export type AuthLog = typeof authLogs.$inferSelect;
export type InsertAuthLog = z.infer<typeof insertAuthLogSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;

// Audit Log Types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Analytics Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type DetailedAnswer = typeof detailedAnswers.$inferSelect;
export type InsertDetailedAnswer = z.infer<typeof insertDetailedAnswerSchema>;
export type ExamAnalytics = typeof examAnalytics.$inferSelect;
export type InsertExamAnalytics = z.infer<typeof insertExamAnalyticsSchema>;
export type PerformanceTrends = typeof performanceTrends.$inferSelect;
export type InsertPerformanceTrends = z.infer<typeof insertPerformanceTrendsSchema>;
export type StudyRecommendations = typeof studyRecommendations.$inferSelect;
export type InsertStudyRecommendations = z.infer<typeof insertStudyRecommendationsSchema>;

// Trending Types
export type UserSubjectInteraction = typeof userSubjectInteractions.$inferSelect;
export type InsertUserSubjectInteraction = z.infer<typeof insertUserSubjectInteractionSchema>;
export type SubjectTrendingStats = typeof subjectTrendingStats.$inferSelect;
export type InsertSubjectTrendingStats = z.infer<typeof insertSubjectTrendingStatsSchema>;
export type DailyTrendingSnapshot = typeof dailyTrendingSnapshot.$inferSelect;
export type InsertDailyTrendingSnapshot = z.infer<typeof insertDailyTrendingSnapshotSchema>;
export type AnonQuestionSession = typeof anonQuestionSessions.$inferSelect;
export type InsertAnonQuestionSession = z.infer<typeof insertAnonQuestionSessionSchema>;

// Upload Types
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;