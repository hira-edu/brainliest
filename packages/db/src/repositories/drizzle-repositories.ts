/*
 * Drizzle mappers rely on `as` assertions when shaping query results. TypeScript already validates the shapes via
 * the Drizzle schema, so disable the lint rule that flags these narrow casts as unnecessary.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { and, eq, gte, inArray, sql, type SQL } from 'drizzle-orm';
import type { DatabaseClient } from '../client';
import * as schema from '../schema';
import type {
  QuestionRepository,
  QuestionRecord,
  QuestionFilter,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionOptionRecord,
} from './question-repository';
import type { ExamRepository, ExamRecord, ExamFilter, CreateExamInput, UpdateExamInput } from './exam-repository';
import type { UserRepository, UserRecord, CreateUserInput, UpdateUserInput } from './user-repository';
import type {
  ExplanationRepository,
  ExplanationRecord,
  CreateExplanationInput,
  ExplanationListRecentOptions,
  ExplanationSummary,
  ExplanationAggregateTotals,
  ExplanationDailyTotalsOptions,
  ExplanationDailyTotal,
} from './explanation-repository';
import type {
  SessionRepository,
  PracticeSessionRecord,
  PracticeSessionMetadata,
  PracticeSessionQuestionState,
  StartSessionInput,
  AdvanceQuestionInput,
  ToggleFlagInput,
  ToggleBookmarkInput,
  UpdateRemainingSecondsInput,
  RecordQuestionProgressInput,
  ExamSessionStatus,
} from './session-repository';
import type { PaginatedResult, PaginationMeta, QuestionId, ExamSlug, UserId, SessionId } from '../types';

const DEFAULT_PAGE_SIZE = 20;
const KATEX_PATTERN = /\\(?:begin|end|frac|sum|int|sqrt|left|right|\(|\[)/;

const containsKatex = (value?: string): boolean => (value ? KATEX_PATTERN.test(value) : false);

type RawMetadata = Record<string, unknown> | null | undefined;

const DEFAULT_SESSION_METADATA: PracticeSessionMetadata = {
  currentQuestionIndex: 0,
  flaggedQuestionIds: [],
  bookmarkedQuestionIds: [],
  remainingSeconds: null,
};

const ensureNumericArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return Math.trunc(item);
      }
      const parsed = Number(item);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    })
    .filter((item): item is number => item !== null);
};

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item : item ? String(item) : null))
    .filter((item): item is string => Boolean(item));
};

const parseSessionMetadata = (raw: RawMetadata): PracticeSessionMetadata => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SESSION_METADATA;
  }

  const flaggedQuestionIds = ensureStringArray((raw as Record<string, unknown>).flaggedQuestionIds);
  const bookmarkedQuestionIds = ensureStringArray((raw as Record<string, unknown>).bookmarkedQuestionIds);
  const currentQuestionIndexValue = (raw as Record<string, unknown>).currentQuestionIndex;
  const remainingSecondsValue = (raw as Record<string, unknown>).remainingSeconds;

  const currentQuestionIndex = Number.isFinite(currentQuestionIndexValue)
    ? Math.max(0, Math.trunc(Number(currentQuestionIndexValue)))
    : DEFAULT_SESSION_METADATA.currentQuestionIndex;

  const remainingSeconds = Number.isFinite(remainingSecondsValue)
    ? Math.max(0, Math.trunc(Number(remainingSecondsValue)))
    : null;

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      key === 'flaggedQuestionIds' ||
      key === 'bookmarkedQuestionIds' ||
      key === 'currentQuestionIndex' ||
      key === 'remainingSeconds'
    ) {
      continue;
    }
    extra[key] = value;
  }

  if (Object.keys(extra).length > 0) {
    return {
      currentQuestionIndex,
      flaggedQuestionIds,
      bookmarkedQuestionIds,
      remainingSeconds,
      extra,
    } satisfies PracticeSessionMetadata;
  }

  return {
    currentQuestionIndex,
    flaggedQuestionIds,
    bookmarkedQuestionIds,
    remainingSeconds,
  } satisfies PracticeSessionMetadata;
};

const serializeSessionMetadata = (metadata: PracticeSessionMetadata): Record<string, unknown> => ({
  flaggedQuestionIds: [...metadata.flaggedQuestionIds],
  bookmarkedQuestionIds: [...(metadata.bookmarkedQuestionIds ?? [])],
  currentQuestionIndex: metadata.currentQuestionIndex,
  remainingSeconds:
    metadata.remainingSeconds !== undefined && metadata.remainingSeconds !== null
      ? Math.max(0, Math.trunc(metadata.remainingSeconds))
      : null,
  ...(metadata.extra ?? {}),
});

function buildPaginationMeta(totalCount: number, page: number, pageSize: number): PaginationMeta {
  const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return {
    page: currentPage,
    pageSize: safePageSize,
    totalCount,
    totalPages,
  };
}

export class DrizzleQuestionRepository implements QuestionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: QuestionId): Promise<QuestionRecord | null> {
    const question = await this.db.query.questions.findFirst({
      where: eq(schema.questions.id, id),
      with: {
        versions: {
          where: eq(schema.questionVersions.isCurrent, true),
          with: {
            choices: true,
          },
        },
      },
    });

    if (!question) {
      return null;
    }

    return this.mapQuestion(question);
  }

  async findByExam(
    examSlug: ExamSlug,
    filters: QuestionFilter,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<QuestionRecord>> {
    const conditions: SQL[] = [eq(schema.questions.examSlug, examSlug)];

    if (filters.subjectSlug !== undefined) {
      conditions.push(eq(schema.questions.subjectSlug, filters.subjectSlug));
    }
    if (filters.difficulty) {
      conditions.push(eq(schema.questions.difficulty, filters.difficulty));
    }
    if (filters.year !== undefined) {
      conditions.push(eq(schema.questions.year, filters.year));
    }
    if (filters.status) {
      const status = filters.status.toLowerCase();
      if (status === 'published') {
        conditions.push(eq(schema.questions.published, true));
      } else if (status === 'draft' || status === 'unpublished') {
        conditions.push(eq(schema.questions.published, false));
      }
    }
    if (filters.domain !== undefined) {
      conditions.push(eq(schema.questions.domain, filters.domain));
    }

    const combinedWhere = conditions.length === 1 ? conditions[0]! : and(...conditions);

    const totalCountResult = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(schema.questions)
      .where(combinedWhere);

    const total = Number(totalCountResult[0]?.value ?? 0);

    const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const offset = Math.max(0, (Math.max(page, 1) - 1) * safePageSize);

    const questions = await this.db.query.questions.findMany({
      where: combinedWhere,
      limit: safePageSize,
      offset,
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        versions: {
          where: eq(schema.questionVersions.isCurrent, true),
          with: {
            choices: true,
          },
        },
      },
    });

    const records = questions.map((item) => this.mapQuestion(item));

    return {
      data: records,
      pagination: buildPaginationMeta(total, page, safePageSize),
    };
  }

  async findManyByIds(ids: QuestionId[]): Promise<QuestionRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const records = await this.db.query.questions.findMany({
      where: inArray(schema.questions.id, ids),
      with: {
        versions: {
          where: eq(schema.questionVersions.isCurrent, true),
          with: {
            choices: true,
          },
        },
      },
    });

    const mapped = records.map((record) => this.mapQuestion(record));
    const byId = new Map(mapped.map((record) => [record.id as QuestionId, record]));

    return ids
      .map((id) => byId.get(id))
      .filter((record): record is QuestionRecord => Boolean(record));
  }

  async create(payload: CreateQuestionInput, actorId: string): Promise<QuestionId> {
    const options = payload.options ?? [];
    if (options.length === 0) {
      throw new Error('Question requires at least one option.');
    }

    const correctIds = new Set<string>();
    if (payload.allowMultiple) {
      for (const index of payload.correctAnswers ?? []) {
        const target = options[index];
        if (target) {
          correctIds.add(target.id);
        }
      }
    } else if (payload.correctAnswer !== undefined) {
      const target = options[payload.correctAnswer];
      if (target) {
        correctIds.add(target.id);
      }
    }

    for (const option of options) {
      if (option.isCorrect) {
        correctIds.add(option.id);
      }
    }

    const insertedQuestion = await this.db.transaction(async (tx) => {
      const [createdQuestion] = await tx
        .insert(schema.questions)
        .values({
          subjectSlug: payload.subjectSlug,
          examSlug: payload.examSlug ?? null,
          type: payload.allowMultiple ? 'multi' : 'single',
          difficulty: payload.difficulty,
          domain: payload.domain ?? null,
          source: payload.source ?? null,
          year: payload.year ?? null,
          published: payload.status === 'published',
        })
        .returning({ id: schema.questions.id });

      if (!createdQuestion) {
        throw new Error('Unable to insert question record.');
      }

      const [createdVersion] = await tx
        .insert(schema.questionVersions)
        .values({
          questionId: createdQuestion.id,
          stemMarkdown: payload.text,
          explanationMarkdown: payload.explanation ?? null,
          hasKatex: containsKatex(payload.text) || containsKatex(payload.explanation),
          isCurrent: true,
        })
        .returning({ id: schema.questionVersions.id });

      if (!createdVersion) {
        throw new Error('Unable to insert question version.');
      }

      await tx
        .update(schema.questions)
        .set({ currentVersionId: createdVersion.id })
        .where(eq(schema.questions.id, createdQuestion.id));

      await tx.insert(schema.choices).values(
        options.map((option, index) => ({
          questionVersionId: createdVersion.id,
          label: option.label ?? String.fromCharCode(65 + index),
          contentMarkdown: option.contentMarkdown,
          isCorrect: correctIds.has(option.id),
          sortOrder: index + 1,
        }))
      );

      return createdQuestion;
    });

    if (!insertedQuestion) {
      throw new Error('Failed to persist question.');
    }

    void actorId;
    return insertedQuestion.id;
  }

  async update(payload: UpdateQuestionInput, actorId: string): Promise<void> {
    const question = await this.db.query.questions.findFirst({
      where: eq(schema.questions.id, payload.id),
      with: {
        versions: {
          where: eq(schema.questionVersions.isCurrent, true),
          with: {
            choices: true,
          },
        },
      },
    });

    if (!question) {
      throw new Error(`Question ${payload.id} not found`);
    }

    await this.db.transaction(async (tx) => {
      const questionUpdates: Partial<typeof schema.questions.$inferInsert> = {};

      if (payload.subjectSlug !== undefined) questionUpdates.subjectSlug = payload.subjectSlug;
      if (payload.examSlug !== undefined) questionUpdates.examSlug = payload.examSlug ?? null;
      if (payload.difficulty) questionUpdates.difficulty = payload.difficulty;
      if (payload.domain !== undefined) questionUpdates.domain = payload.domain ?? null;
      if (payload.source !== undefined) questionUpdates.source = payload.source ?? null;
      if (payload.year !== undefined) questionUpdates.year = payload.year ?? null;
      if (payload.status) questionUpdates.published = payload.status === 'published';
      if (payload.allowMultiple !== undefined) {
        questionUpdates.type = payload.allowMultiple ? 'multi' : 'single';
      }

      if (Object.keys(questionUpdates).length > 0) {
        await tx.update(schema.questions).set(questionUpdates).where(eq(schema.questions.id, payload.id));
      }

      if (payload.text || payload.explanation || payload.options) {
        const currentVersion = question.versions[0];
        if (!currentVersion) {
          throw new Error(`Question ${payload.id} is missing a current version`);
        }

        const newStem = payload.text ?? currentVersion.stemMarkdown;
        const newExplanation = payload.explanation ?? currentVersion.explanationMarkdown ?? undefined;

      await tx
        .update(schema.questionVersions)
        .set({
          stemMarkdown: newStem,
          explanationMarkdown: newExplanation ?? null,
          hasKatex: containsKatex(newStem) || containsKatex(newExplanation),
        })
        .where(eq(schema.questionVersions.id, currentVersion.id));

        if (payload.options && payload.options.length > 0) {
          await tx.delete(schema.choices).where(eq(schema.choices.questionVersionId, currentVersion.id));

          const allowMultiple = payload.allowMultiple ?? question.type === 'multi';
          const correctIds = new Set<string>();
          if (allowMultiple) {
            for (const index of payload.correctAnswers ?? []) {
              const target = payload.options[index];
              if (target) correctIds.add(target.id);
            }
          } else if (payload.correctAnswer !== undefined) {
            const target = payload.options[payload.correctAnswer];
            if (target) correctIds.add(target.id);
          }

          for (const option of payload.options) {
            if (option.isCorrect) {
              correctIds.add(option.id);
            }
          }

          await tx.insert(schema.choices).values(
            payload.options.map((option, index) => ({
              questionVersionId: currentVersion.id,
              label: option.label ?? String.fromCharCode(65 + index),
              contentMarkdown: option.contentMarkdown,
              isCorrect: correctIds.has(option.id),
              sortOrder: index + 1,
            }))
          );
        }
      }
    });

    void actorId;
  }

  async delete(id: QuestionId, actorId: string): Promise<void> {
    await this.db.delete(schema.questions).where(eq(schema.questions.id, id));
    void actorId;
  }

  async bulkCreate(payloads: CreateQuestionInput[], actorId: string): Promise<QuestionId[]> {
    const ids: QuestionId[] = [];
    for (const payload of payloads) {
      const id = await this.create(payload, actorId);
      ids.push(id);
    }
    return ids;
  }

  private mapQuestion(question: typeof schema.questions.$inferSelect & {
    versions: Array<
      typeof schema.questionVersions.$inferSelect & {
        choices: Array<typeof schema.choices.$inferSelect>;
      }
    >;
  }): QuestionRecord {
    const currentVersion = question.versions[0];
    const choices = [...(currentVersion?.choices ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    const options: QuestionOptionRecord[] = choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      contentMarkdown: choice.contentMarkdown,
      isCorrect: choice.isCorrect,
      sortOrder: choice.sortOrder ?? 0,
    }));

    const correctChoiceIds = options.filter((option) => option.isCorrect).map((option) => option.id);

    const examSlug = question.examSlug ?? undefined;

    const explanationMarkdown = currentVersion?.explanationMarkdown ?? undefined;

    return {
      id: question.id,
      subjectSlug: question.subjectSlug,
      ...(examSlug !== undefined ? { examSlug } : {}),
      type: question.type,
      difficulty: question.difficulty,
      domain: question.domain,
      stemMarkdown: currentVersion?.stemMarkdown ?? '',
      currentVersionId: question.currentVersionId,
      ...(explanationMarkdown !== undefined ? { explanationMarkdown } : {}),
      options,
      correctChoiceIds,
      ...(question.source !== undefined && question.source !== null ? { source: question.source } : {}),
      ...(question.year !== undefined && question.year !== null ? { year: question.year } : {}),
      published: question.published,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}

export class DrizzleExamRepository implements ExamRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findBySlug(slug: ExamSlug): Promise<ExamRecord | null> {
    const exam = await this.db.query.exams.findFirst({
      where: eq(schema.exams.slug, slug),
    });

    if (!exam) {
      return null;
    }

    return this.mapExam(exam);
  }

  async list(filters: ExamFilter, page: number, pageSize: number): Promise<PaginatedResult<ExamRecord>> {
    const conditions: SQL[] = [];
    if (filters.subjectSlug !== undefined) {
      conditions.push(eq(schema.exams.subjectSlug, filters.subjectSlug));
    }
    if (filters.status) {
      conditions.push(eq(schema.exams.status, filters.status));
    }
    if (filters.difficulty) {
      conditions.push(eq(schema.exams.difficulty, filters.difficulty));
    }

    const whereClause = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0]! : and(...conditions);

    const totalRows = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(schema.exams)
      .where(whereClause ?? sql`TRUE`);

    const total = Number(totalRows[0]?.value ?? 0);

    const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const offset = Math.max(0, (Math.max(page, 1) - 1) * safePageSize);

    const examQueryOptions: NonNullable<Parameters<typeof this.db.query.exams.findMany>[0]> = {
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      limit: safePageSize,
      offset,
    };

    if (whereClause) {
      examQueryOptions.where = whereClause;
    }

    const exams = await this.db.query.exams.findMany(examQueryOptions);

    return {
      data: exams.map((exam) => this.mapExam(exam)),
      pagination: buildPaginationMeta(total, page, safePageSize),
    };
  }

  async create(input: CreateExamInput, actorId: string): Promise<ExamSlug> {
    const [exam] = await this.db
      .insert(schema.exams)
      .values({
        slug: input.slug,
        subjectSlug: input.subjectSlug,
        title: input.title,
        description: input.description ?? null,
        difficulty: input.difficulty ?? null,
        durationMinutes: input.durationMinutes ?? null,
        questionTarget: input.questionTarget ?? null,
        status: input.status ?? 'draft',
        metadata: input.metadata ?? {},
      })
      .returning({ slug: schema.exams.slug });

    if (!exam) {
      throw new Error('Unable to insert exam record.');
    }

    void actorId;
    return exam.slug;
  }

  async update(input: UpdateExamInput, actorId: string): Promise<void> {
    const updates: Partial<typeof schema.exams.$inferInsert> = {};
    if (input.subjectSlug) updates.subjectSlug = input.subjectSlug;
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.difficulty) updates.difficulty = input.difficulty;
    if (input.durationMinutes !== undefined) updates.durationMinutes = input.durationMinutes;
    if (input.questionTarget !== undefined) updates.questionTarget = input.questionTarget;
    if (input.status) updates.status = input.status;
    if (input.metadata) updates.metadata = input.metadata;

    if (Object.keys(updates).length > 0) {
      await this.db.update(schema.exams).set(updates).where(eq(schema.exams.slug, input.slug));
    }

    void actorId;
  }

  async delete(slug: ExamSlug, actorId: string): Promise<void> {
    await this.db.delete(schema.exams).where(eq(schema.exams.slug, slug));
    void actorId;
  }

  private mapExam(exam: typeof schema.exams.$inferSelect): ExamRecord {
    return {
      slug: exam.slug,
      subjectSlug: exam.subjectSlug,
      title: exam.title,
      description: exam.description,
      difficulty: exam.difficulty,
      durationMinutes: exam.durationMinutes,
      questionTarget: exam.questionTarget,
      status: exam.status,
      metadata: exam.metadata ?? {},
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    };
  }
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: UserId): Promise<UserRecord | null> {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return user ? this.mapUser(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.email, email) });
    return user ? this.mapUser(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserId> {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: input.email,
        hashedPassword: input.hashedPassword,
        role: input.role,
        status: input.status ?? 'active',
        profile: input.profile ?? {},
      })
      .returning({ id: schema.users.id });

    if (!user) {
      throw new Error('Unable to insert user record.');
    }

    return user.id;
  }

  async update(input: UpdateUserInput): Promise<void> {
    const updates: Partial<typeof schema.users.$inferInsert> = {};
    if (input.email !== undefined) updates.email = input.email;
    if (input.hashedPassword !== undefined) updates.hashedPassword = input.hashedPassword;
    if (input.role) updates.role = input.role;
    if (input.status) updates.status = input.status;
    if (input.profile) updates.profile = input.profile;

    if (Object.keys(updates).length > 0) {
      await this.db.update(schema.users).set(updates).where(eq(schema.users.id, input.id));
    }
  }

  async delete(id: UserId): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  private mapUser(user: typeof schema.users.$inferSelect): UserRecord {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile ?? {},
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export class DrizzleExplanationRepository implements ExplanationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findByQuestionAndPattern(questionId: QuestionId, answerPattern: string): Promise<ExplanationRecord | null> {
    const explanation = await this.db
      .select({
        id: schema.questionAiExplanations.id,
        questionId: schema.questions.id,
        questionVersionId: schema.questionAiExplanations.questionVersionId,
        answerPattern: schema.questionAiExplanations.answerHash,
        content: schema.questionAiExplanations.contentMarkdown,
        model: schema.questionAiExplanations.model,
        language: schema.questionAiExplanations.language,
        tokensTotal: schema.questionAiExplanations.tokensTotal,
        costCents: schema.questionAiExplanations.costCents,
        createdAt: schema.questionAiExplanations.createdAt,
      })
      .from(schema.questionAiExplanations)
      .innerJoin(schema.questionVersions, eq(schema.questionVersions.id, schema.questionAiExplanations.questionVersionId))
      .innerJoin(schema.questions, eq(schema.questions.id, schema.questionVersions.questionId))
      .where(and(eq(schema.questions.id, questionId), eq(schema.questionAiExplanations.answerHash, answerPattern)))
      .limit(1);

    const row = explanation[0];
    if (!row) {
      return null;
    }

      return {
        id: row.id,
        questionId: row.questionId,
        questionVersionId: row.questionVersionId,
        answerPattern: row.answerPattern,
        content: row.content,
        model: row.model,
        language: row.language,
        tokensTotal: row.tokensTotal,
        costCents: row.costCents,
        createdAt: row.createdAt,
      };
  }

  async create(record: CreateExplanationInput): Promise<string> {
    const [created] = await this.db
      .insert(schema.questionAiExplanations)
      .values({
        questionVersionId: record.questionVersionId,
        answerHash: record.answerPattern,
        contentMarkdown: record.content,
        model: record.model,
        language: record.language,
        tokensTotal: record.tokensTotal,
        costCents: record.costCents,
      })
      .returning({ id: schema.questionAiExplanations.id });

    if (!created) {
      throw new Error('Unable to insert explanation record.');
    }

    return created.id;
  }

  async listRecent(options: ExplanationListRecentOptions = {}): Promise<PaginatedResult<ExplanationSummary>> {
    const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;
    const page = options.page && options.page > 0 ? options.page : 1;

    const totalCountResult = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(schema.questionAiExplanations);

    const totalCount = Number(totalCountResult[0]?.value ?? 0);
    const offset = Math.max(0, (page - 1) * pageSize);

    const rows = await this.db
      .select({
        id: schema.questionAiExplanations.id,
        questionId: schema.questions.id,
        questionVersionId: schema.questionAiExplanations.questionVersionId,
        answerPattern: schema.questionAiExplanations.answerHash,
        content: schema.questionAiExplanations.contentMarkdown,
        model: schema.questionAiExplanations.model,
        language: schema.questionAiExplanations.language,
        tokensTotal: schema.questionAiExplanations.tokensTotal,
        costCents: schema.questionAiExplanations.costCents,
        createdAt: schema.questionAiExplanations.createdAt,
        subjectSlug: schema.questions.subjectSlug,
        examSlug: schema.questions.examSlug,
        questionStem: schema.questionVersions.stemMarkdown,
      })
      .from(schema.questionAiExplanations)
      .innerJoin(schema.questionVersions, eq(schema.questionVersions.id, schema.questionAiExplanations.questionVersionId))
      .innerJoin(schema.questions, eq(schema.questions.id, schema.questionVersions.questionId))
      .orderBy(sql`"question_ai_explanations"."created_at" DESC`)
      .limit(pageSize)
      .offset(offset);

    return {
      data: rows.map((row) => ({
        id: row.id,
        questionId: row.questionId,
        questionVersionId: row.questionVersionId,
        answerPattern: row.answerPattern,
        content: row.content,
        model: row.model,
        language: row.language,
        tokensTotal: row.tokensTotal,
        costCents: row.costCents,
        createdAt: row.createdAt,
        subjectSlug: row.subjectSlug,
        examSlug: row.examSlug,
        questionStem: row.questionStem,
      })),
      pagination: buildPaginationMeta(totalCount, page, pageSize),
    };
  }

  async getAggregateTotals(): Promise<ExplanationAggregateTotals> {
    const [totals] = await this.db
      .select({
        totalCount: sql<number>`count(*)`,
        tokensTotal: sql<number>`COALESCE(SUM(${schema.questionAiExplanations.tokensTotal}), 0)`,
        costCentsTotal: sql<number>`COALESCE(SUM(${schema.questionAiExplanations.costCents}), 0)`,
      })
      .from(schema.questionAiExplanations);

    return {
      totalCount: Number(totals?.totalCount ?? 0),
      tokensTotal: Number(totals?.tokensTotal ?? 0),
      costCentsTotal: Number(totals?.costCentsTotal ?? 0),
    };
  }

  async listDailyTotals(options: ExplanationDailyTotalsOptions = {}): Promise<ExplanationDailyTotal[]> {
    const windowDays = Math.min(Math.max(options.days ?? 7, 1), 90);
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (windowDays - 1));

    const rows = await this.db
      .select({
        day: sql<Date>`date_trunc('day', ${schema.questionAiExplanations.createdAt})`,
        totalCount: sql<number>`count(*)`,
        tokensTotal: sql<number>`COALESCE(SUM(${schema.questionAiExplanations.tokensTotal}), 0)`,
        costCentsTotal: sql<number>`COALESCE(SUM(${schema.questionAiExplanations.costCents}), 0)`,
      })
      .from(schema.questionAiExplanations)
      .where(gte(schema.questionAiExplanations.createdAt, startDate))
      .groupBy(sql`date_trunc('day', ${schema.questionAiExplanations.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.questionAiExplanations.createdAt})`);

    return rows.map((row) => {
      const dayValue = row.day instanceof Date ? row.day : new Date(row.day as unknown as string);
      return {
        day: dayValue,
        totalCount: Number(row.totalCount ?? 0),
        tokensTotal: Number(row.tokensTotal ?? 0),
        costCentsTotal: Number(row.costCentsTotal ?? 0),
      } satisfies ExplanationDailyTotal;
    });
  }
}

export class DrizzleSessionRepository implements SessionRepository {
  private readonly questionRepository: DrizzleQuestionRepository;
  private readonly examRepository: DrizzleExamRepository;

  constructor(private readonly db: DatabaseClient) {
    this.questionRepository = new DrizzleQuestionRepository(db);
    this.examRepository = new DrizzleExamRepository(db);
  }

  async startSession(input: StartSessionInput): Promise<PracticeSessionRecord> {
    const examRecord = await this.examRepository.findBySlug(input.examSlug);

    const existing = await this.db.query.examSessions.findFirst({
      where: and(eq(schema.examSessions.userId, input.userId), eq(schema.examSessions.examSlug, input.examSlug), eq(schema.examSessions.status, 'in_progress')),
    });

    if (existing) {
      const record = await this.getSession(existing.id as SessionId);
      if (record) {
        return record;
      }
    }

    const sessionId = await this.db.transaction(async (tx) => {
      const questions = await tx
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.examSlug, input.examSlug))
        .orderBy(schema.questions.createdAt);

      if (questions.length === 0) {
        throw new Error(`No questions found for exam ${input.examSlug}`);
      }

      const defaultDurationSeconds = examRecord?.durationMinutes ? examRecord.durationMinutes * 60 : undefined;

      const metadata: PracticeSessionMetadata = {
        currentQuestionIndex: 0,
        flaggedQuestionIds: [],
        bookmarkedQuestionIds: [],
        remainingSeconds: input.remainingSeconds ?? defaultDurationSeconds ?? null,
      };

      const [session] = await tx
        .insert(schema.examSessions)
        .values({
          userId: input.userId,
          examSlug: input.examSlug,
          status: 'in_progress',
          metadata: serializeSessionMetadata(metadata),
          timeSpentSeconds: 0,
        })
        .returning({ id: schema.examSessions.id });

      if (!session) {
        throw new Error('Failed to create exam session');
      }

      await tx.insert(schema.examSessionQuestions).values(
        questions.map((question, index) => ({
          sessionId: session.id,
          questionId: question.id,
          orderIndex: index,
          selectedAnswers: [],
          isCorrect: null,
          timeSpentSeconds: 0,
        }))
      );

      return session.id as SessionId;
    });

    const created = await this.getSession(sessionId);
    if (!created) {
      throw new Error('Unable to load created session');
    }
    return created;
  }

  async getSession(sessionId: SessionId): Promise<PracticeSessionRecord | null> {
    const session = await this.db.query.examSessions.findFirst({
      where: eq(schema.examSessions.id, sessionId),
      with: {
        exam: true,
        questions: {
          orderBy: (fields, { asc }) => asc(fields.orderIndex),
        },
      },
    });

    if (!session) {
      return null;
    }

    const metadata = parseSessionMetadata(session.metadata as RawMetadata);

    const examRecord = session.exam
      ? {
          slug: session.exam.slug as ExamSlug,
          subjectSlug: session.exam.subjectSlug,
          title: session.exam.title,
          description: session.exam.description,
          difficulty: session.exam.difficulty,
          durationMinutes: session.exam.durationMinutes,
          questionTarget: session.exam.questionTarget,
          status: session.exam.status,
          metadata: session.exam.metadata ?? {},
          createdAt: session.exam.createdAt,
          updatedAt: session.exam.updatedAt,
        }
      : await this.examRepository.findBySlug(session.examSlug as ExamSlug);

    if (!examRecord) {
      throw new Error(`Exam ${String(session.examSlug)} not found for session ${String(sessionId)}`);
    }

    const questionIds = session.questions.map((row) => row.questionId as QuestionId);
    const questionRecords = await this.questionRepository.findManyByIds(questionIds);
    const questionRecordMap = new Map<QuestionId, QuestionRecord>(
      questionRecords.map((record) => [record.id as QuestionId, record])
    );

    const flaggedSet = new Set(metadata.flaggedQuestionIds);
    const bookmarkedSet = new Set(metadata.bookmarkedQuestionIds ?? []);

    const questions: PracticeSessionQuestionState[] = session.questions.map((row) => {
      const record = questionRecordMap.get(row.questionId as QuestionId);
      if (!record) {
        throw new Error(`Question ${String(row.questionId)} not found for session ${String(sessionId)}`);
      }

      return {
        questionId: row.questionId as QuestionId,
        orderIndex: row.orderIndex,
        selectedAnswers: ensureNumericArray(row.selectedAnswers),
        isCorrect: row.isCorrect ?? null,
        timeSpentSeconds: row.timeSpentSeconds ?? null,
        question: record,
        isFlagged: flaggedSet.has(row.questionId as QuestionId),
        isBookmarked: bookmarkedSet.has(row.questionId as QuestionId),
      };
    });

    return {
      id: session.id as SessionId,
      userId: session.userId as UserId,
      examSlug: session.examSlug as ExamSlug,
      status: session.status as ExamSessionStatus,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      metadata,
      exam: examRecord,
      questions,
    };
  }

  async advanceQuestion(input: AdvanceQuestionInput): Promise<void> {
    await this.updateMetadata(input.sessionId, (metadata) => ({
      ...metadata,
      currentQuestionIndex: Math.max(0, input.currentQuestionIndex),
    }));
  }

  async toggleFlag(input: ToggleFlagInput): Promise<void> {
    await this.updateMetadata(input.sessionId, (metadata) => {
      const flagged = new Set(metadata.flaggedQuestionIds);
      if (input.flagged) {
        flagged.add(input.questionId);
      } else {
        flagged.delete(input.questionId);
      }
      return {
        ...metadata,
        flaggedQuestionIds: Array.from(flagged),
      };
    });
  }

  async toggleBookmark(input: ToggleBookmarkInput): Promise<void> {
    await this.updateMetadata(input.sessionId, (metadata) => {
      const bookmarked = new Set(metadata.bookmarkedQuestionIds ?? []);
      if (input.bookmarked) {
        bookmarked.add(input.questionId);
      } else {
        bookmarked.delete(input.questionId);
      }
      return {
        ...metadata,
        bookmarkedQuestionIds: Array.from(bookmarked),
      };
    });
  }

  async updateRemainingSeconds(input: UpdateRemainingSecondsInput): Promise<void> {
    await this.updateMetadata(input.sessionId, (metadata) => ({
      ...metadata,
      remainingSeconds: Math.max(0, input.remainingSeconds),
    }));
  }

  async recordQuestionProgress(input: RecordQuestionProgressInput): Promise<void> {
    await this.db
      .update(schema.examSessionQuestions)
      .set({
        selectedAnswers: input.selectedAnswers.map((value) => Math.trunc(value)),
        timeSpentSeconds:
          input.timeSpentSeconds !== undefined && input.timeSpentSeconds !== null
            ? Math.max(0, Math.trunc(input.timeSpentSeconds))
            : null,
      })
      .where(
        and(
          eq(schema.examSessionQuestions.sessionId, input.sessionId),
          eq(schema.examSessionQuestions.questionId, input.questionId)
        )
      );
  }

  private async updateMetadata(
    sessionId: SessionId,
    mutator: (metadata: PracticeSessionMetadata) => PracticeSessionMetadata
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const row = await tx
        .select({ metadata: schema.examSessions.metadata })
        .from(schema.examSessions)
        .where(eq(schema.examSessions.id, sessionId))
        .limit(1);

      const current = parseSessionMetadata(row[0]?.metadata as RawMetadata);
      const next = mutator(current);

      await tx
        .update(schema.examSessions)
        .set({ metadata: serializeSessionMetadata(next) })
        .where(eq(schema.examSessions.id, sessionId));
    });
  }
}

export interface RepositoryBundle {
  questions: QuestionRepository;
  exams: ExamRepository;
  users: UserRepository;
  explanations: ExplanationRepository;
  sessions: SessionRepository;
}

export function createRepositories(db: DatabaseClient): RepositoryBundle {
  return {
    questions: new DrizzleQuestionRepository(db),
    exams: new DrizzleExamRepository(db),
    users: new DrizzleUserRepository(db),
    explanations: new DrizzleExplanationRepository(db),
    sessions: new DrizzleSessionRepository(db),
  };
}
