/**
 * Enhanced Icon Registry Service
 * Manages both downloaded SVG icons and database-driven mappings
 */

import { apiRequest } from './queryClient';

export interface IconMetadata {
  id: string;
  name: string;
  category: string;
  description?: string;
  keywords: string[];
  tags: string[];
  filename: string;
  size: number;
  downloaded: string;
  isOfficial: boolean;
  brandColors?: Record<string, string>;
}

export interface DatabaseIcon {
  id: string;
  name: string;
  category: string;
  description: string;
  svgContent: string;
  brandColors: Record<string, string>;
  isOfficial: boolean;
  isActive: boolean;
}

class IconRegistryService {
  private iconCache = new Map<string, IconMetadata>();
  private subjectMappings = new Map<string, string>();
  private initialized = false;

  /**
   * Initialize the icon registry with downloaded icons
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🎨 Initializing icon registry...');
      
      // Load downloaded icons registry
      const { DOWNLOADED_ICONS } = await import('./downloaded-icon-registry');
      
      // Populate icon cache
      DOWNLOADED_ICONS.forEach((icon: IconMetadata) => {
        this.iconCache.set(icon.id, icon);
      });
      
      // Load subject mappings from database
      await this.loadSubjectMappings();
      
      this.initialized = true;
      console.log(`✅ Icon registry initialized with ${this.iconCache.size} icons`);
    } catch (error) {
      console.warn('⚠️ Failed to load downloaded icons, using fallback:', error);
      this.initialized = true;
    }
  }

  /**
   * Load subject-to-icon mappings from database
   */
  async loadSubjectMappings(): Promise<void> {
    try {
      const mappings = await apiRequest('/api/icons/mappings');
      mappings.forEach((mapping: any) => {
        this.subjectMappings.set(mapping.subjectSlug, mapping.iconId);
      });
      console.log(`📋 Loaded ${mappings.length} subject icon mappings`);
    } catch (error) {
      console.warn('⚠️ Failed to load subject mappings:', error);
    }
  }

  /**
   * Get icon for a subject with intelligent fallback
   */
  async getIconForSubject(subjectName: string): Promise<{ iconId: string; source: 'database' | 'downloaded' | 'pattern' | 'fallback' }> {
    await this.initialize();

    // 1. Try database mapping first (highest priority)
    const dbIconId = await this.getDatabaseIconForSubject(subjectName);
    if (dbIconId && this.hasIcon(dbIconId)) {
      return { iconId: dbIconId, source: 'database' };
    }

    // 2. Try pattern matching with downloaded icons
    const patternIcon = this.getIconByPattern(subjectName);
    if (patternIcon) {
      return { iconId: patternIcon, source: 'pattern' };
    }

    // 3. Try direct name matching
    const directMatch = this.getIconByName(subjectName);
    if (directMatch) {
      return { iconId: directMatch, source: 'downloaded' };
    }

    // 4. Fallback to academic icon
    return { iconId: 'academic', source: 'fallback' };
  }

  /**
   * Get database icon for subject
   */
  async getDatabaseIconForSubject(subjectName: string): Promise<string | null> {
    try {
      // Find subject slug from name
      const subjects = await apiRequest('/api/subjects');
      const subject = subjects.find((s: any) => s.name === subjectName);
      
      if (subject) {
        return this.subjectMappings.get(subject.slug) || null;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get database icon:', error);
      return null;
    }
  }

  /**
   * Enhanced pattern matching for certification and technology subjects
   */
  getIconByPattern(subjectName: string): string | null {
    const name = subjectName.toLowerCase();
    
    // Enhanced certification and subject patterns
    const patterns = [
      // Cloud Certifications
      { keywords: ['aws', 'amazon web services', 'solutions architect', 'cloud practitioner'], icon: 'aws' },
      { keywords: ['azure', 'microsoft cloud', 'az-', 'microsoft azure'], icon: 'azure' },
      { keywords: ['gcp', 'google cloud', 'gce', 'cloud engineer'], icon: 'gcp' },
      
      // Security Certifications
      { keywords: ['comptia', 'security+', 'network+', 'a+', 'security plus'], icon: 'comptia' },
      { keywords: ['cissp', 'certified information systems security'], icon: 'cissp' },
      { keywords: ['cisa', 'certified information systems auditor'], icon: 'cisa' },
      
      // Networking
      { keywords: ['cisco', 'ccna', 'ccnp', 'ccie', 'routing', 'switching'], icon: 'cisco' },
      
      // Project Management
      { keywords: ['pmp', 'project management professional', 'project management', 'pmbok'], icon: 'pmp' },
      { keywords: ['project management', 'project manager', 'pm certification'], icon: 'project-management' },
      
      // DevOps & Cloud
      { keywords: ['docker', 'container', 'containerization'], icon: 'docker' },
      { keywords: ['kubernetes', 'k8s', 'container orchestration'], icon: 'kubernetes' },
      { keywords: ['terraform', 'infrastructure as code', 'iac'], icon: 'terraform' },
      
      // Programming Languages
      { keywords: ['javascript', 'js', 'ecmascript', 'node.js'], icon: 'javascript' },
      { keywords: ['python', 'django', 'flask', 'py'], icon: 'python' },
      { keywords: ['java', 'jvm', 'spring', 'hibernate'], icon: 'java' },
      { keywords: ['react', 'reactjs', 'jsx'], icon: 'react' },
      { keywords: ['node', 'nodejs', 'node.js', 'npm'], icon: 'nodejs' },
      
      // Technology & Databases
      { keywords: ['database', 'sql', 'mysql', 'postgresql', 'mongodb'], icon: 'database' },
      
      // Academic Subjects
      { keywords: ['mathematics', 'math', 'calculus', 'algebra', 'geometry'], icon: 'mathematics' },
      { keywords: ['statistics', 'stats', 'probability', 'data analysis'], icon: 'statistics' },
      { keywords: ['science', 'physics', 'chemistry', 'biology'], icon: 'science' },
      { keywords: ['computer science', 'cs', 'computing', 'algorithms'], icon: 'computer-science' },
      { keywords: ['engineering', 'mechanical', 'electrical', 'civil'], icon: 'engineering' },
      { keywords: ['business', 'management', 'admin', 'mba', 'finance'], icon: 'business' },
      { keywords: ['medical', 'medicine', 'health', 'nursing', 'pharmacy'], icon: 'medical' },
      { keywords: ['law', 'legal', 'attorney', 'paralegal'], icon: 'law' },
      
      // General certifications and tests
      { keywords: ['certification', 'certified', 'certificate'], icon: 'certification' },
      { keywords: ['test', 'exam', 'practice'], icon: 'test' },
      { keywords: ['study', 'learning', 'education'], icon: 'study' },
    ];

    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => name.includes(keyword))) {
        if (this.hasIcon(pattern.icon)) {
          console.log(`🔗 Pattern matched "${subjectName}" -> ${pattern.icon}`);
          return pattern.icon;
        }
      }
    }

    return null;
  }

  /**
   * Get icon by exact name matching
   */
  getIconByName(subjectName: string): string | null {
    const name = subjectName.toLowerCase();
    
    for (const [iconId, icon] of this.iconCache) {
      if (icon.name.toLowerCase() === name || 
          icon.keywords.some(keyword => keyword.toLowerCase() === name)) {
        return iconId;
      }
    }
    
    return null;
  }

  /**
   * Check if icon exists in registry
   */
  hasIcon(iconId: string): boolean {
    return this.iconCache.has(iconId);
  }

  /**
   * Get icon metadata
   */
  getIconMetadata(iconId: string): IconMetadata | null {
    return this.iconCache.get(iconId) || null;
  }

  /**
   * Get icon file path
   */
  getIconPath(iconId: string): string {
    const icon = this.iconCache.get(iconId);
    return icon ? `/icons/${icon.filename}` : '/icons/academic.svg';
  }

  /**
   * Search icons by query
   */
  searchIcons(query: string): IconMetadata[] {
    const searchTerm = query.toLowerCase();
    const results: IconMetadata[] = [];
    
    for (const icon of this.iconCache.values()) {
      if (icon.name.toLowerCase().includes(searchTerm) ||
          icon.id.toLowerCase().includes(searchTerm) ||
          icon.category.toLowerCase().includes(searchTerm) ||
          icon.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))) {
        results.push(icon);
      }
    }
    
    return results;
  }

  /**
   * Get icons by category
   */
  getIconsByCategory(category: string): IconMetadata[] {
    const results: IconMetadata[] = [];
    
    for (const icon of this.iconCache.values()) {
      if (icon.category === category) {
        results.push(icon);
      }
    }
    
    return results;
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    
    for (const icon of this.iconCache.values()) {
      categories.add(icon.category);
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    return {
      totalIcons: this.iconCache.size,
      categories: this.getCategories().length,
      subjectMappings: this.subjectMappings.size,
      initialized: this.initialized
    };
  }
}

// Singleton instance
export const iconRegistryService = new IconRegistryService();