/**
 * Optimized Icon Service
 * Enterprise-grade icon management with preloading, caching, and performance optimization
 */

import { Subject } from '../../../shared/schema';

export interface IconCacheEntry {
  iconId: string;
  svgContent: string;
  loadTime: number;
  source: 'database' | 'downloaded' | 'pattern' | 'fallback';
}

export interface IconPerformanceMetrics {
  totalLoadTime: number;
  cacheHitRate: number;
  totalRequests: number;
  averageLoadTime: number;
}

class OptimizedIconService {
  private iconCache = new Map<string, IconCacheEntry>();
  private subjectIconCache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<IconCacheEntry>>();
  private performanceMetrics: IconPerformanceMetrics = {
    totalLoadTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    averageLoadTime: 0
  };

  // Critical icons that should be preloaded for performance
  private readonly CRITICAL_ICONS = [
    'aws', 'azure', 'comptia', 'cisco', 'pmp', 'hesi', 'teas', 'gre', 'lsat', 'toefl',
    'academic', 'test', 'computer-science', 'react', 'ged'
  ];

  // Pattern mapping for fast subject-to-icon resolution
  private readonly PATTERN_MAP = new Map([
    // Professional Certifications
    ['aws', ['aws', 'amazon', 'cloud', 'solutions architect']],
    ['azure', ['azure', 'microsoft', 'cloud']],
    ['comptia', ['comptia', 'security+', 'security plus']],
    ['cisco', ['cisco', 'ccna', 'ccnp', 'networking']],
    ['pmp', ['pmp', 'project management', 'professional']],
    ['google-cloud', ['google cloud', 'gcp', 'google']],
    ['oracle', ['oracle', 'database']],
    ['vmware', ['vmware', 'virtualization']],
    ['kubernetes', ['kubernetes', 'k8s', 'container']],
    
    // Test Preparation
    ['hesi', ['hesi', 'health education systems']],
    ['teas', ['teas', 'test of essential academic skills']],
    ['gre', ['gre', 'graduate record examination']],
    ['lsat', ['lsat', 'law school admission test']],
    ['toefl', ['toefl', 'english proficiency']],
    ['ged', ['ged', 'general educational development']],
    
    // Academic Subjects
    ['computer-science', ['computer science', 'programming', 'software']],
    ['mathematics', ['mathematics', 'math', 'calculus', 'algebra']],
    ['statistics', ['statistics', 'data analysis', 'biostatistics']],
    ['physics', ['physics', 'quantum', 'mechanics']],
    ['chemistry', ['chemistry', 'organic', 'biochemistry']],
    ['biology', ['biology', 'anatomy', 'physiology']],
    
    // Technology
    ['react', ['react', 'javascript', 'frontend']],
    ['database', ['database', 'sql', 'postgresql']],
    ['algorithm', ['algorithm', 'data structures']],
    ['web-dev', ['web development', 'html', 'css']],
    
    // General
    ['test', ['test', 'exam', 'practice']],
    ['academic', ['academic', 'general', 'education']]
  ]);

  /**
   * Initialize the optimized icon service with preloading
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing optimized icon service...');
    
    try {
      // Preload critical icons in parallel
      await this.preloadCriticalIcons();
      
      // Build subject mappings from database
      await this.buildSubjectMappings();
      
      console.log(`✅ Optimized icon service initialized with ${this.iconCache.size} cached icons`);
    } catch (error) {
      console.warn('⚠️ Failed to initialize optimized icon service:', error);
    }
  }

  /**
   * Preload critical icons for instant access
   */
  private async preloadCriticalIcons(): Promise<void> {
    const startTime = performance.now();
    
    const preloadPromises = this.CRITICAL_ICONS.map(async (iconId) => {
      try {
        const response = await fetch(`/icons/${iconId}.svg`);
        if (response.ok) {
          const svgContent = await response.text();
          const entry: IconCacheEntry = {
            iconId,
            svgContent,
            loadTime: performance.now() - startTime,
            source: 'downloaded'
          };
          this.iconCache.set(iconId, entry);
          return entry;
        }
      } catch (error) {
        console.warn(`Failed to preload icon ${iconId}:`, error);
      }
      return null;
    });

    const results = await Promise.all(preloadPromises);
    const successCount = results.filter(r => r !== null).length;
    
    console.log(`📦 Preloaded ${successCount}/${this.CRITICAL_ICONS.length} critical icons`);
  }

  /**
   * Build subject-to-icon mappings from database subjects
   */
  private async buildSubjectMappings(): Promise<void> {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) return;
      
      const subjects: Subject[] = await response.json();
      
      subjects.forEach(subject => {
        const iconId = this.resolveIconByPattern(subject.name);
        if (iconId && iconId !== 'academic') {
          this.subjectIconCache.set(subject.slug, iconId);
        }
      });
      
      console.log(`🗂️ Built ${this.subjectIconCache.size} subject-icon mappings`);
    } catch (error) {
      console.warn('Failed to build subject mappings:', error);
    }
  }

  /**
   * Get icon for subject with optimized caching
   */
  async getIconForSubject(subjectSlug: string): Promise<IconCacheEntry | null> {
    this.performanceMetrics.totalRequests++;
    const startTime = performance.now();

    // Check subject mapping cache first
    const cachedIconId = this.subjectIconCache.get(subjectSlug);
    if (cachedIconId) {
      const cachedIcon = this.iconCache.get(cachedIconId);
      if (cachedIcon) {
        this.updatePerformanceMetrics(performance.now() - startTime, true);
        return cachedIcon;
      }
    }

    // Try to resolve icon by subject name pattern
    const iconId = this.resolveIconByPattern(subjectSlug);
    if (iconId) {
      const icon = await this.loadIcon(iconId);
      if (icon) {
        this.subjectIconCache.set(subjectSlug, iconId);
        this.updatePerformanceMetrics(performance.now() - startTime, false);
        return icon;
      }
    }

    // Fallback to academic icon
    const fallbackIcon = await this.loadIcon('academic');
    this.updatePerformanceMetrics(performance.now() - startTime, false);
    return fallbackIcon;
  }

  /**
   * Load icon with deduplication and caching
   */
  private async loadIcon(iconId: string): Promise<IconCacheEntry | null> {
    // Check cache first
    const cached = this.iconCache.get(iconId);
    if (cached) return cached;

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(iconId);
    if (loadingPromise) return loadingPromise;

    // Start loading
    const promise = this.fetchIcon(iconId);
    this.loadingPromises.set(iconId, promise);

    try {
      const result = await promise;
      this.loadingPromises.delete(iconId);
      return result;
    } catch (error) {
      this.loadingPromises.delete(iconId);
      throw error;
    }
  }

  /**
   * Fetch icon from server
   */
  private async fetchIcon(iconId: string): Promise<IconCacheEntry | null> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`/icons/${iconId}.svg`);
      if (!response.ok) return null;
      
      const svgContent = await response.text();
      const entry: IconCacheEntry = {
        iconId,
        svgContent,
        loadTime: performance.now() - startTime,
        source: 'downloaded'
      };
      
      this.iconCache.set(iconId, entry);
      return entry;
    } catch (error) {
      console.warn(`Failed to fetch icon ${iconId}:`, error);
      return null;
    }
  }

  /**
   * Resolve icon ID by pattern matching
   */
  private resolveIconByPattern(subjectName: string): string {
    const searchText = subjectName.toLowerCase();
    
    for (const [iconId, patterns] of this.PATTERN_MAP) {
      for (const pattern of patterns) {
        if (searchText.includes(pattern)) {
          return iconId;
        }
      }
    }
    
    return 'academic'; // fallback
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(loadTime: number, cacheHit: boolean): void {
    this.performanceMetrics.totalLoadTime += loadTime;
    this.performanceMetrics.averageLoadTime = 
      this.performanceMetrics.totalLoadTime / this.performanceMetrics.totalRequests;
    
    if (cacheHit) {
      this.performanceMetrics.cacheHitRate = 
        ((this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalRequests - 1)) + 1) / 
        this.performanceMetrics.totalRequests;
    } else {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalRequests - 1)) / 
        this.performanceMetrics.totalRequests;
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): IconPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Prefetch icons for a batch of subjects
   */
  async prefetchSubjectIcons(subjects: Subject[]): Promise<void> {
    const iconIds = new Set<string>();
    
    subjects.forEach(subject => {
      const iconId = this.resolveIconByPattern(subject.name);
      if (iconId && iconId !== 'academic') {
        iconIds.add(iconId);
      }
    });

    const prefetchPromises = Array.from(iconIds).map(iconId => this.loadIcon(iconId));
    await Promise.allSettled(prefetchPromises);
    
    console.log(`🔄 Prefetched ${iconIds.size} icons for ${subjects.length} subjects`);
  }

  /**
   * Clear caches (useful for development)
   */
  clearCache(): void {
    this.iconCache.clear();
    this.subjectIconCache.clear();
    this.loadingPromises.clear();
    this.performanceMetrics = {
      totalLoadTime: 0,
      cacheHitRate: 0,
      totalRequests: 0,
      averageLoadTime: 0
    };
    console.log('🧹 Icon caches cleared');
  }
}

export const optimizedIconService = new OptimizedIconService();