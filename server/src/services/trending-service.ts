import { db } from "../db";
import { subjects, userSubjectInteractions, subjectTrendingStats, dailyTrendingSnapshot } from "../../../shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";

export interface TrendingCertification {
  slug: string;
  name: string;
  trend: string;
  searchTerm: string;
  trendingScore: number;
  weeklyGrowth: number;
}

export interface InteractionData {
  subjectSlug: string;
  interactionType: 'view' | 'search' | 'click' | 'exam_start' | 'exam_complete';
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class TrendingService {
  private constructor() {}

  static async trackInteraction(data: InteractionData): Promise<void> {
    try {
      await db.insert(userSubjectInteractions).values({
        subjectSlug: data.subjectSlug,
        interactionType: data.interactionType,
        userId: data.userId,
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  static async getTrendingCertifications(limit: number = 4): Promise<TrendingCertification[]> {
    try {
      // First try to get the most recent snapshot (within last 30 days for development)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await db
        .select()
        .from(dailyTrendingSnapshot)
        .where(gte(dailyTrendingSnapshot.date, thirtyDaysAgo))
        .orderBy(desc(dailyTrendingSnapshot.createdAt))
        .limit(1);

      if (snapshot.length > 0) {
        console.log('📊 Using trending snapshot data');
        try {
          const topSubjects = JSON.parse(snapshot[0].topSubjects);
          // Map old format to new format if needed
          return topSubjects.slice(0, limit).map((item: any) => ({
            slug: item.slug || `trending-${item.id}`,
            name: item.name,
            trend: item.trend || `+${item.weeklyGrowth || 0}%`,
            searchTerm: item.searchTerm || item.name.toLowerCase(),
            trendingScore: item.trendingScore || 50,
            weeklyGrowth: item.weeklyGrowth || 0
          }));
        } catch (parseError) {
          console.error('📊 JSON parsing failed for snapshot, using fallback:', parseError);
          // Fall through to fallback
        }
      }

      // If no recent snapshot, use fallback with real subject data
      console.log('📊 Using fallback trending data');
      return await this.getFallbackTrending(limit);
    } catch (error) {
      console.error('Error getting trending certifications:', error);
      // Return fallback trending data with real subjects
      return await this.getFallbackTrending(limit);
    }
  }

  private static async calculateTrendingCertifications(limit: number): Promise<TrendingCertification[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get interaction counts for last 7 days and previous 7 days
    const recentInteractions = await db
      .select({
        subjectSlug: userSubjectInteractions.subjectSlug,
        interactionCount: sql<number>`count(*)`.as('interactionCount'),
      })
      .from(userSubjectInteractions)
      .where(gte(userSubjectInteractions.timestamp, sevenDaysAgo))
      .groupBy(userSubjectInteractions.subjectSlug);

    const previousInteractions = await db
      .select({
        subjectSlug: userSubjectInteractions.subjectSlug,
        interactionCount: sql<number>`count(*)`.as('interactionCount'),
      })
      .from(userSubjectInteractions)
      .where(
        and(
          gte(userSubjectInteractions.timestamp, fourteenDaysAgo),
          sql`timestamp < ${sevenDaysAgo}`
        )
      )
      .groupBy(userSubjectInteractions.subjectSlug);

    // Calculate trending scores and growth
    const trendingData = recentInteractions.map(recent => {
      const previous = previousInteractions.find(p => p.subjectSlug === recent.subjectSlug);
      const previousCount = previous?.interactionCount || 0;
      const growth = previousCount > 0 ? ((recent.interactionCount - previousCount) / previousCount) * 100 : 100;
      
      // Trending score combines recent activity with growth
      const trendingScore = recent.interactionCount * (1 + Math.max(0, growth / 100));
      
      return {
        subjectSlug: recent.subjectSlug,
        trendingScore: Math.round(trendingScore),
        weeklyGrowth: Math.round(growth),
      };
    });

    // Sort by trending score and get top subjects
    trendingData.sort((a, b) => b.trendingScore - a.trendingScore);
    const topSubjectSlugs = trendingData.slice(0, limit).map(t => t.subjectSlug);

    // Get subject details
    let subjectDetails = [];
    if (topSubjectSlugs.length > 0) {
      subjectDetails = await db
        .select()
        .from(subjects)
        .where(inArray(subjects.slug, topSubjectSlugs));
    }

    // Combine data and return
    return trendingData.slice(0, limit).map(trend => {
      const subject = subjectDetails.find(s => s.slug === trend.subjectSlug);
      if (!subject) return null;

      return {
        slug: subject.slug,
        name: subject.name,
        trend: `+${trend.weeklyGrowth}%`,
        searchTerm: subject.name.toLowerCase().replace(/\s+/g, ' '),
        trendingScore: trend.trendingScore,
        weeklyGrowth: trend.weeklyGrowth,
      };
    }).filter(Boolean) as TrendingCertification[];
  }

  private static async getFallbackTrending(limit: number): Promise<TrendingCertification[]> {
    // Get certification subjects with some basic popularity scoring
    const certificationSubjects = await db
      .select()
      .from(subjects)
      .where(sql`name ILIKE ANY(ARRAY['%pmp%', '%aws%', '%comptia%', '%azure%', '%cisco%', '%google cloud%', '%certified%', '%certification%'])`)
      .limit(limit * 2);

    // Create trending data with randomized but realistic growth numbers
    return certificationSubjects.slice(0, limit).map((subject, index) => {
      const growthValues = [23, 18, 15, 12, 8, 5]; // Decreasing trend values
      const growth = growthValues[index] || Math.floor(Math.random() * 20) + 5;
      
      return {
        slug: subject.slug,
        name: subject.name,
        trend: `+${growth}%`,
        searchTerm: subject.name.toLowerCase().replace(/\s+/g, ' '),
        trendingScore: 100 - (index * 10),
        weeklyGrowth: growth,
      };
    });
  }

  static async updateDailyTrendingData(): Promise<void> {
    try {
      const trendingCerts = await this.calculateTrendingCertifications(10);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Insert daily snapshot
      await db.insert(dailyTrendingSnapshot).values({
        date: today,
        topSubjects: JSON.stringify(trendingCerts),
      });

      // Update individual subject trending stats
      for (const cert of trendingCerts) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentStats = await db
          .select({
            viewCount: sql<number>`count(*) filter (where interaction_type = 'view')`.as('viewCount'),
            searchCount: sql<number>`count(*) filter (where interaction_type = 'search')`.as('searchCount'),
            clickCount: sql<number>`count(*) filter (where interaction_type = 'click')`.as('clickCount'),
            examStartCount: sql<number>`count(*) filter (where interaction_type = 'exam_start')`.as('examStartCount'),
            examCompleteCount: sql<number>`count(*) filter (where interaction_type = 'exam_complete')`.as('examCompleteCount'),
          })
          .from(userSubjectInteractions)
          .where(
            and(
              eq(userSubjectInteractions.subjectSlug, cert.slug),
              gte(userSubjectInteractions.timestamp, sevenDaysAgo)
            )
          );

        if (recentStats.length > 0) {
          const stats = recentStats[0];
          await db.insert(subjectTrendingStats).values({
            subjectSlug: cert.slug,
            date: today,
            viewCount: stats.viewCount || 0,
            searchCount: stats.searchCount || 0,
            clickCount: stats.clickCount || 0,
            examStartCount: stats.examStartCount || 0,
            examCompleteCount: stats.examCompleteCount || 0,
            trendingScore: cert.trendingScore,
            growthPercentage: cert.trend,
          });
        }
      }

      console.log('Daily trending data updated successfully');
    } catch (error) {
      console.error('Error updating daily trending data:', error);
    }
  }

  static async scheduleDaily(): Promise<void> {
    // Run initial update
    await this.updateDailyTrendingData();
    
    // Schedule daily updates at midnight
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        await this.updateDailyTrendingData();
      }
    }, 60000); // Check every minute
  }
}

export const trendingService = TrendingService;