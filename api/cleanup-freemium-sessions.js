/**
 * Vercel Cron Job API endpoint for FreemiumService cleanup
 * Deploy with vercel.json cron configuration
 */

import { freemiumService } from '../server/src/services/freemium-service.js';

export default async function handler(req, res) {
  // Verify this is a Vercel Cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Starting freemium session cleanup via Vercel Cron...');
    
    const cleanedCount = await freemiumService.cleanupOldSessions();
    
    console.log(`✅ Freemium cleanup completed: ${cleanedCount} sessions cleaned`);
    
    res.status(200).json({
      success: true,
      message: 'Freemium session cleanup completed',
      cleanedSessions: cleanedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Freemium cleanup failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}