/**
 * Icon Management API Routes
 * RESTful API for icon management and retrieval
 */

import { Router } from 'express';
import { iconManagementService } from '../services/icon-management-service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { z } from 'zod';
// Inline validation middleware
const validateRequest = (schema: any, source = 'body') => {
  return (req: any, res: any, next: any) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const result = schema.safeParse(data);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: result.error.errors 
        });
      }
      if (source === 'query') {
        req.query = result.data;
      } else {
        req.body = result.data;
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Validation error' });
    }
  };
};

const router = Router();

// Get icon for subject
router.get('/subject/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const icon = await iconManagementService.getIconForSubject(slug);
    
    if (!icon) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    // Track usage
    await iconManagementService.trackIconUsage(icon.id, 'subject', slug);
    
    res.json({
      id: icon.id,
      name: icon.name,
      category: icon.category,
      svgContent: icon.svgContent,
      brandColors: icon.brandColors
    });
  } catch (error) {
    console.error('Error getting subject icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available icons (for admin panel)
router.get('/available', requireAdmin, async (req, res) => {
  try {
    const { db } = await import('../storage');
    const { icons } = await import('../../shared/icon-schema');
    const { eq } = await import('drizzle-orm');
    
    const availableIcons = await db
      .select({
        id: icons.id,
        name: icons.name,
        category: icons.category,
        description: icons.description,
        brandColors: icons.brandColors,
        tags: icons.tags,
        isOfficial: icons.isOfficial
      })
      .from(icons)
      .where(eq(icons.isActive, true))
      .orderBy(icons.category, icons.name);
    
    res.json(availableIcons);
  } catch (error) {
    console.error('Error getting available icons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search icons
const searchIconsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(20)
});

router.get('/search', validateRequest(searchIconsSchema, 'query'), async (req, res) => {
  try {
    const { query, category, limit } = req.query as any;
    const { db } = await import('../storage');
    const { icons } = await import('../../shared/icon-schema');
    const { eq, and, ilike, or, sql } = await import('drizzle-orm');
    
    let whereConditions = [eq(icons.isActive, true)];
    
    if (category) {
      whereConditions.push(eq(icons.category, category));
    }
    
    if (query) {
      whereConditions.push(
        or(
          ilike(icons.name, `%${query}%`),
          ilike(icons.description, `%${query}%`),
          sql`${icons.keywords} && ARRAY[${query}]`,
          sql`${icons.tags} && ARRAY[${query}]`
        )
      );
    }
    
    const searchResults = await db
      .select({
        id: icons.id,
        name: icons.name,
        category: icons.category,
        description: icons.description,
        brandColors: icons.brandColors,
        tags: icons.tags,
        isOfficial: icons.isOfficial
      })
      .from(icons)
      .where(and(...whereConditions))
      .limit(limit)
      .orderBy(icons.isOfficial, icons.name);
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching icons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign icon to subject (Admin only)
const assignIconSchema = z.object({
  subjectSlug: z.string(),
  iconId: z.string(),
  priority: z.enum(['high', 'normal', 'low']).default('normal')
});

router.post('/assign/subject', requireAdmin, validateRequest(assignIconSchema), async (req, res) => {
  try {
    const { subjectSlug, iconId, priority } = req.body;
    const { db } = await import('../storage');
    const { subjectIconMappings } = await import('../../shared/icon-schema');
    
    await db.insert(subjectIconMappings)
      .values({
        subjectSlug,
        iconId,
        priority,
        isActive: true
      })
      .onConflictDoUpdate({
        target: [subjectIconMappings.subjectSlug],
        set: {
          iconId,
          priority,
          updatedAt: new Date()
        }
      });
    
    res.json({ success: true, message: 'Icon assigned successfully' });
  } catch (error) {
    console.error('Error assigning icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get icon usage analytics (Admin only)
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { db } = await import('../storage');
    const { iconUsageAnalytics, icons } = await import('../../shared/icon-schema');
    const { eq, desc, sql } = await import('drizzle-orm');
    
    const analytics = await db
      .select({
        iconId: iconUsageAnalytics.iconId,
        iconName: icons.name,
        totalViews: sql<number>`sum(${iconUsageAnalytics.viewCount}::int)`,
        lastUsed: iconUsageAnalytics.lastUsed
      })
      .from(iconUsageAnalytics)
      .innerJoin(icons, eq(icons.id, iconUsageAnalytics.iconId))
      .groupBy(iconUsageAnalytics.iconId, icons.name, iconUsageAnalytics.lastUsed)
      .orderBy(desc(sql`sum(${iconUsageAnalytics.viewCount}::int)`))
      .limit(50);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting icon analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize icon system (Admin only)
router.post('/initialize', requireAdmin, async (req, res) => {
  try {
    await iconManagementService.initializeIconSystem();
    res.json({ success: true, message: 'Icon system initialized successfully' });
  } catch (error) {
    console.error('Error initializing icon system:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;