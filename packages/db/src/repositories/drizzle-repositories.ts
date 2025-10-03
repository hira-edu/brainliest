import { and, eq, sql, type SQL } from 'drizzle-orm';
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
} from './explanation-repository';
import type { PaginatedResult, PaginationMeta, QuestionId, ExamSlug, UserId } from '../types';

const DEFAULT_PAGE_SIZE = 20;
const KATEX_PATTERN = /\\(?:begin|end|frac|sum|int|sqrt|left|right|\(|\[)/;

const containsKatex = (value?: string): boolean => (value ? KATEX_PATTERN.test(value) : false);

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
}

export interface RepositoryBundle {
  questions: QuestionRepository;
  exams: ExamRepository;
  users: UserRepository;
  explanations: ExplanationRepository;
}

export function createRepositories(db: DatabaseClient): RepositoryBundle {
  return {
    questions: new DrizzleQuestionRepository(db),
    exams: new DrizzleExamRepository(db),
    users: new DrizzleUserRepository(db),
    explanations: new DrizzleExplanationRepository(db),
  };
}
