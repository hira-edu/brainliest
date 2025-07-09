/**
 * Client-Side Icon Service
 * Interfaces with the database-driven icon system
 */

import { apiRequest } from './queryClient';

export interface DatabaseIcon {
  id: string;
  name: string;
  category: string;
  svgContent: string;
  brandColors: Record<string, string>;
}

export interface IconSearchResult {
  id: string;
  name: string;
  category: string;
  description: string;
  brandColors: Record<string, string>;
  tags: string[];
  isOfficial: boolean;
}

class IconService {
  private iconCache = new Map<string, DatabaseIcon>();
  private subjectIconCache = new Map<string, DatabaseIcon>();

  /**
   * Get icon for a subject from the database
   */
  async getIconForSubject(subjectSlug: string): Promise<DatabaseIcon | null> {
    if (this.subjectIconCache.has(subjectSlug)) {
      return this.subjectIconCache.get(subjectSlug)!;
    }

    try {
      const response = await apiRequest(`/api/icons/subject/${subjectSlug}`);
      const icon = response as DatabaseIcon;
      
      if (icon) {
        this.subjectIconCache.set(subjectSlug, icon);
      }
      
      return icon;
    } catch (error) {
      console.warn(`Failed to get icon for subject ${subjectSlug}:`, error);
      return null;
    }
  }

  /**
   * Search available icons
   */
  async searchIcons(
    query?: string, 
    category?: string, 
    limit = 20
  ): Promise<IconSearchResult[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      const response = await apiRequest(`/api/icons/search?${params}`);
      return response as IconSearchResult[];
    } catch (error) {
      console.error('Failed to search icons:', error);
      return [];
    }
  }

  /**
   * Get all available icons (admin only)
   */
  async getAllAvailableIcons(): Promise<IconSearchResult[]> {
    try {
      const response = await apiRequest('/api/icons/available');
      return response as IconSearchResult[];
    } catch (error) {
      console.error('Failed to get available icons:', error);
      return [];
    }
  }

  /**
   * Assign icon to subject (admin only)
   */
  async assignIconToSubject(
    subjectSlug: string, 
    iconId: string, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<boolean> {
    try {
      await apiRequest('/api/icons/assign/subject', {
        method: 'POST',
        body: JSON.stringify({ subjectSlug, iconId, priority }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Clear cache for this subject
      this.subjectIconCache.delete(subjectSlug);
      
      return true;
    } catch (error) {
      console.error('Failed to assign icon to subject:', error);
      return false;
    }
  }

  /**
   * Initialize icon system (admin only)
   */
  async initializeIconSystem(): Promise<boolean> {
    try {
      await apiRequest('/api/icons/initialize', {
        method: 'POST'
      });
      
      // Clear all caches
      this.iconCache.clear();
      this.subjectIconCache.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize icon system:', error);
      return false;
    }
  }

  /**
   * Get icon usage analytics (admin only)
   */
  async getIconAnalytics(): Promise<any[]> {
    try {
      const response = await apiRequest('/api/icons/analytics');
      return response as any[];
    } catch (error) {
      console.error('Failed to get icon analytics:', error);
      return [];
    }
  }

  /**
   * Clear icon caches
   */
  clearCache(): void {
    this.iconCache.clear();
    this.subjectIconCache.clear();
  }
}

export const iconService = new IconService();