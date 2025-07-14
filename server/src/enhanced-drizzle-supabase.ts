/**
 * Enhanced Drizzle + Supabase Integration
 * Combines Drizzle's type safety with Supabase's platform features
 */

import { eq, and, desc, sql, count } from "drizzle-orm";
import { db, supabase, supabaseOperations } from "./supabase-db";
import * as schema from "../../shared/schema";

// Re-export for convenience
export { db, supabase } from "./supabase-db";

/**
 * Enhanced database operations combining Drizzle + Supabase
 */
export class EnhancedDatabase {
  // DRIZZLE: Complex queries with full type safety
  static async getSubjectsWithStats() {
    return await db
      .select({
        slug: schema.subjects.slug,
        name: schema.subjects.name,
        description: schema.subjects.description,
        icon: schema.subjects.icon,
        categorySlug: schema.subjects.categorySlug,
        subcategorySlug: schema.subjects.subcategorySlug,
        examCount: schema.subjects.examCount,
        questionCount: schema.subjects.questionCount,
        // Aggregate data from related tables
        totalSessions: sql<number>`
          COALESCE((
            SELECT COUNT(*) 
            FROM ${schema.examSessions} 
            WHERE ${schema.examSessions.subjectSlug} = ${schema.subjects.slug}
          ), 0)
        `,
        avgScore: sql<number>`
          COALESCE((
            SELECT AVG(score) 
            FROM ${schema.examSessions} 
            WHERE ${schema.examSessions.subjectSlug} = ${schema.subjects.slug}
            AND ${schema.examSessions.isCompleted} = true
          ), 0)
        `,
      })
      .from(schema.subjects)
      .where(eq(schema.subjects.isActive, true))
      .orderBy(desc(sql`total_sessions`));
  }

  // DRIZZLE: Advanced filtering and joins
  static async getExamsByCategory(categorySlug: string, difficulty?: string) {
    let query = db
      .select({
        examSlug: schema.exams.slug,
        examTitle: schema.exams.title,
        examDescription: schema.exams.description,
        questionCount: schema.exams.questionCount,
        duration: schema.exams.duration,
        difficulty: schema.exams.difficulty,
        subjectName: schema.subjects.name,
        categoryName: schema.categories.name,
      })
      .from(schema.exams)
      .innerJoin(
        schema.subjects,
        eq(schema.exams.subjectSlug, schema.subjects.slug)
      )
      .innerJoin(
        schema.categories,
        eq(schema.subjects.categorySlug, schema.categories.slug)
      )
      .where(
        and(
          eq(schema.categories.slug, categorySlug),
          eq(schema.exams.isActive, true)
        )
      );

    if (difficulty) {
      query = query.where(
        and(
          eq(schema.categories.slug, categorySlug),
          eq(schema.exams.isActive, true),
          eq(schema.exams.difficulty, difficulty as any)
        )
      );
    }

    return await query.orderBy(schema.exams.title);
  }

  // DRIZZLE: Transaction support for complex operations
  static async createExamWithQuestions(examData: any, questions: any[]) {
    return await db.transaction(async (tx) => {
      // Create exam
      const [exam] = await tx.insert(schema.exams).values(examData).returning();

      // Create questions
      const questionData = questions.map((q, index) => ({
        ...q,
        examSlug: exam.slug,
        order: index + 1,
      }));

      const insertedQuestions = await tx
        .insert(schema.questions)
        .values(questionData)
        .returning();

      // Update subject exam count
      await tx
        .update(schema.subjects)
        .set({
          examCount: sql`${schema.subjects.examCount} + 1`,
          questionCount: sql`${schema.subjects.questionCount} + ${questions.length}`,
        })
        .where(eq(schema.subjects.slug, examData.subjectSlug));

      return { exam, questions: insertedQuestions };
    });
  }

  // DRIZZLE: Full-text search with proper indexing
  static async searchQuestions(searchTerm: string, subjectSlug?: string) {
    let query = db
      .select({
        id: schema.questions.id,
        text: schema.questions.text,
        options: schema.questions.options,
        explanation: schema.questions.explanation,
        difficulty: schema.questions.difficulty,
        examSlug: schema.questions.examSlug,
        subjectSlug: schema.questions.subjectSlug,
        // Search ranking
        rank: sql<number>`
          ts_rank(${schema.questions.searchVector}, plainto_tsquery('english', ${searchTerm}))
        `,
      })
      .from(schema.questions)
      .where(
        sql`${schema.questions.searchVector} @@ plainto_tsquery('english', ${searchTerm})`
      );

    if (subjectSlug) {
      query = query.where(
        and(
          sql`${schema.questions.searchVector} @@ plainto_tsquery('english', ${searchTerm})`,
          eq(schema.questions.subjectSlug, subjectSlug)
        )
      );
    }

    return await query.orderBy(desc(sql`rank`)).limit(50);
  }

  // SUPABASE: Real-time operations
  static subscribeToExamUpdates(
    examSlug: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`exam_${examSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_sessions",
          filter: `exam_slug=eq.${examSlug}`,
        },
        callback
      )
      .subscribe();
  }

  // SUPABASE: Auth integration with Drizzle queries
  static async getUserExamHistory(userId: string) {
    // Get user sessions with exam details using Drizzle
    const sessions = await db
      .select({
        sessionId: schema.examSessions.id,
        examTitle: schema.exams.title,
        subjectName: schema.subjects.name,
        score: schema.examSessions.score,
        completedAt: schema.examSessions.completedAt,
        timeSpent: schema.examSessions.timeSpent,
        isPassed: schema.examSessions.isPassed,
      })
      .from(schema.examSessions)
      .innerJoin(
        schema.exams,
        eq(schema.examSessions.examSlug, schema.exams.slug)
      )
      .innerJoin(
        schema.subjects,
        eq(schema.exams.subjectSlug, schema.subjects.slug)
      )
      .where(eq(schema.examSessions.userId, userId))
      .orderBy(desc(schema.examSessions.completedAt));

    return sessions;
  }

  // HYBRID: Combine both for powerful analytics
  static async getAdvancedAnalytics(subjectSlug: string) {
    // Use Drizzle for complex aggregations
    const dbStats = await db
      .select({
        totalQuestions: count(schema.questions.id),
        averageDifficulty: sql<string>`
          CASE 
            WHEN AVG(CASE 
              WHEN difficulty = 'Beginner' THEN 1
              WHEN difficulty = 'Intermediate' THEN 2  
              WHEN difficulty = 'Advanced' THEN 3
              WHEN difficulty = 'Expert' THEN 4
            END) < 1.5 THEN 'Beginner'
            WHEN AVG(CASE 
              WHEN difficulty = 'Beginner' THEN 1
              WHEN difficulty = 'Intermediate' THEN 2  
              WHEN difficulty = 'Advanced' THEN 3
              WHEN difficulty = 'Expert' THEN 4
            END) < 2.5 THEN 'Intermediate'
            WHEN AVG(CASE 
              WHEN difficulty = 'Beginner' THEN 1
              WHEN difficulty = 'Intermediate' THEN 2  
              WHEN difficulty = 'Advanced' THEN 3
              WHEN difficulty = 'Expert' THEN 4
            END) < 3.5 THEN 'Advanced'
            ELSE 'Expert'
          END
        `,
        totalSessions: sql<number>`
          (SELECT COUNT(*) FROM ${schema.examSessions} 
           WHERE ${schema.examSessions.subjectSlug} = ${subjectSlug})
        `,
        averageScore: sql<number>`
          (SELECT AVG(score) FROM ${schema.examSessions} 
           WHERE ${schema.examSessions.subjectSlug} = ${subjectSlug} 
           AND ${schema.examSessions.isCompleted} = true)
        `,
      })
      .from(schema.questions)
      .where(eq(schema.questions.subjectSlug, subjectSlug));

    // Use Supabase for real-time active sessions
    const { data: activeSessions } = await supabase
      .from("exam_sessions")
      .select("id, started_at, current_question_index")
      .eq("subject_slug", subjectSlug)
      .is("completed_at", null)
      .gte(
        "started_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    return {
      ...dbStats[0],
      activeSessionsCount: activeSessions?.length || 0,
      activeSessions: activeSessions || [],
    };
  }
}

/**
 * Utility functions for common operations
 */
export const DrizzleSupabaseUtils = {
  // Type-safe query builders
  buildSubjectQuery: (filters: {
    categorySlug?: string;
    subcategorySlug?: string;
    difficulty?: string;
    isActive?: boolean;
  }) => {
    let query = db.select().from(schema.subjects);
    const conditions = [];

    if (filters.categorySlug) {
      conditions.push(eq(schema.subjects.categorySlug, filters.categorySlug));
    }
    if (filters.subcategorySlug) {
      conditions.push(
        eq(schema.subjects.subcategorySlug, filters.subcategorySlug)
      );
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(schema.subjects.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query;
  },

  // Real-time query sync
  createRealtimeQuery: async (tableName: string, drizzleQuery: any) => {
    // Execute initial query with Drizzle
    const initialData = await drizzleQuery;

    // Set up real-time subscription with Supabase
    const subscription = supabase
      .channel(`realtime_${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        async (payload) => {
          // Re-execute Drizzle query when data changes
          const updatedData = await drizzleQuery;
          // Emit updated data (you'd integrate this with your state management)
          console.log("Data updated:", updatedData);
        }
      )
      .subscribe();

    return { initialData, subscription };
  },
};

export default EnhancedDatabase;
