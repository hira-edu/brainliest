/**
 * Lazy Icon Loader - Implements proper lazy loading with LRU cache
 * Fixes audit issues: cache implementation, lazy loading logic
 */



import { IconComponent, IconRegistryEntry } from './types';

// LRU Cache implementation for icons
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Icon lazy loader with proper caching
export class IconLazyLoader {
  private componentCache = new LRUCache<IconComponent>(100);
  private loadingPromises = new Map<string, Promise<IconComponent | null>>();

  constructor(private cacheSize: number = 100) {
    this.componentCache = new LRUCache<IconComponent>(cacheSize);
  }

  /**
   * Lazy load an icon component with caching
   */
  async loadIcon(iconId: string): Promise<IconComponent | null> {
    // Check cache first
    const cached = this.componentCache.get(iconId);
    if (cached) {
      return cached;
    }

    // Check if already loading
    if (this.loadingPromises.has(iconId)) {
      return this.loadingPromises.get(iconId)!;
    }

    // Start loading
    const loadPromise = this.performIconLoad(iconId);
    this.loadingPromises.set(iconId, loadPromise);

    try {
      const component = await loadPromise;
      if (component) {
        this.componentCache.set(iconId, component);
      }
      return component;
    } finally {
      this.loadingPromises.delete(iconId);
    }
  }

  /**
   * Perform the actual icon loading
   */
  private async performIconLoad(iconId: string): Promise<IconComponent | null> {
    try {
      // Determine which module to load based on icon category
      const category = this.inferCategoryFromId(iconId);
      
      switch (category) {
        case 'certification':
          const certIcons = await import('./definitions/certification-icons');
          return this.findIconInModule(certIcons.icons, iconId);
        
        case 'academic':
          const academicIcons = await import('./definitions/academic-icons');
          return this.findIconInModule(academicIcons.icons, iconId);
        
        case 'technology':
          const techIcons = await import('./definitions/technology-icons');
          return this.findIconInModule(techIcons.icons, iconId);
        
        case 'general':
        default:
          const generalIcons = await import('./definitions/general-icons');
          return this.findIconInModule(generalIcons.icons, iconId);
      }
    } catch (error) {
      console.warn(`Failed to lazy load icon "${iconId}":`, error);
      return null;
    }
  }

  /**
   * Find icon component in a module's icon registry entries
   */
  private findIconInModule(
    icons: IconRegistryEntry[], 
    iconId: string
  ): IconComponent | null {
    const entry = icons.find(icon => 
      icon.metadata.id.toLowerCase() === iconId.toLowerCase()
    );
    return entry?.component || null;
  }

  /**
   * Infer category from icon ID for targeted loading
   */
  private inferCategoryFromId(iconId: string): string {
    const id = iconId.toLowerCase();
    
    if (['pmp', 'aws', 'comptia', 'cisco', 'azure', 'google-cloud', 'oracle', 'vmware', 'kubernetes', 'docker'].includes(id)) {
      return 'certification';
    }
    
    if (['mathematics', 'statistics', 'science', 'engineering', 'business', 'medical'].includes(id)) {
      return 'academic';
    }
    
    if (['code', 'database', 'web-dev', 'algorithm', 'cloud', 'computer-science'].includes(id)) {
      return 'technology';
    }
    
    return 'general';
  }

  /**
   * Preload critical icons for immediate availability
   */
  async preloadCriticalIcons(iconIds: string[]): Promise<void> {
    const preloadPromises = iconIds.map(id => this.loadIcon(id));
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.componentCache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.componentCache.size(),
      maxCacheSize: this.cacheSize,
      loadingCount: this.loadingPromises.size
    };
  }
}

// Singleton lazy loader instance
export const iconLazyLoader = new IconLazyLoader();