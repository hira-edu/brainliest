/**
 * Vercel Cron Job API endpoint for TrendingService daily updates
 * Deploy with vercel.json cron configuration
 */

import { trendingService } from '../server/src/services/trending-service.js';

export default async function handler(req, res) {
  // Verify this is a Vercel Cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📈 Starting trending data update via Vercel Cron...');
    
    const result = await trendingService.updateDailyTrendingData();
    
    if (result.success) {
      console.log('✅ Trending data update completed successfully');
      
      res.status(200).json({
        success: true,
        message: 'Trending data update completed',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Trending data update failed:', result.error);
      
      res.status(500).json({
        success: false,
        error: 'Trending update failed',
        message: result.error,
        context: result.context,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Trending cron job failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Cron job failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}