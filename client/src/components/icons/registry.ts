/**
 * Icon Registry - Centralized Icon Management System
 * Implements registry pattern for scalable icon management
 */

import { IconRegistryEntry, IconComponent, IconMetadata, IconCategory, SubjectIconMapping } from './types';

class IconRegistry {
  private icons = new Map<string, IconRegistryEntry>();
  private searchIndex = new Map<string, Set<string>>();
  private categoryIndex = new Map<IconCategory, Set<string>>();

  /**
   * Register a new icon in the registry
   */
  registerIcon(entry: IconRegistryEntry): void {
    const { metadata } = entry;
    
    // Store the icon
    this.icons.set(metadata.id, entry);
    
    // Build search index
    this.buildSearchIndex(metadata);
    
    // Build category index
    this.buildCategoryIndex(metadata);
  }

  /**
   * Register multiple icons at once
   */
  registerIcons(entries: IconRegistryEntry[]): void {
    entries.forEach(entry => this.registerIcon(entry));
  }

  /**
   * Get icon component by ID
   */
  getIcon(id: string): IconComponent | null {
    return this.icons.get(id)?.component || null;
  }

  /**
   * Get icon metadata by ID
   */
  getIconMetadata(id: string): IconMetadata | null {
    return this.icons.get(id)?.metadata || null;
  }

  /**
   * Check if icon exists
   */
  hasIcon(id: string): boolean {
    return this.icons.has(id);
  }

  /**
   * Get all available icon IDs
   */
  getAllIconIds(): string[] {
    return Array.from(this.icons.keys());
  }

  /**
   * Search icons by query string
   */
  searchIcons(query: string, category?: IconCategory): IconRegistryEntry[] {
    if (!query.trim()) {
      return category ? this.getIconsByCategory(category) : [];
    }

    const normalizedQuery = query.toLowerCase();
    const matchingIds = new Set<string>();

    // Search in indexed terms
    for (const [term, iconIds] of this.searchIndex) {
      if (term.includes(normalizedQuery)) {
        iconIds.forEach(id => matchingIds.add(id));
      }
    }

    // Get matching entries
    let results = Array.from(matchingIds)
      .map(id => this.icons.get(id))
      .filter((entry): entry is IconRegistryEntry => entry !== undefined);

    // Filter by category if specified
    if (category) {
      results = results.filter(entry => entry.metadata.category === category);
    }

    // Sort by relevance (exact matches first, then partial matches)
    return results.sort((a, b) => {
      const aExact = a.metadata.name.toLowerCase() === normalizedQuery;
      const bExact = b.metadata.name.toLowerCase() === normalizedQuery;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.metadata.name.toLowerCase().startsWith(normalizedQuery);
      const bStarts = b.metadata.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.metadata.name.localeCompare(b.metadata.name);
    });
  }

  /**
   * Get all icons in a specific category
   */
  getIconsByCategory(category: IconCategory): IconRegistryEntry[] {
    const iconIds = this.categoryIndex.get(category) || new Set();
    return Array.from(iconIds)
      .map(id => this.icons.get(id))
      .filter((entry): entry is IconRegistryEntry => entry !== undefined)
      .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
  }

  /**
   * Get icons by multiple categories
   */
  getIconsByCategories(categories: IconCategory[]): IconRegistryEntry[] {
    const results = new Map<string, IconRegistryEntry>();
    
    categories.forEach(category => {
      this.getIconsByCategory(category).forEach(entry => {
        results.set(entry.metadata.id, entry);
      });
    });
    
    return Array.from(results.values())
      .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
  }

  /**
   * Get suggested icons based on subject name
   */
  getIconForSubject(subjectName: string): IconComponent | null {
    // Try exact mapping first
    const exactMapping = this.getExactSubjectMapping(subjectName);
    if (exactMapping) {
      return this.getIcon(exactMapping);
    }

    // Try fuzzy search
    const searchResults = this.searchIcons(subjectName);
    if (searchResults.length > 0) {
      return searchResults[0].component;
    }

    // Try category-based fallback
    const category = this.inferCategoryFromSubject(subjectName);
    const categoryIcons = this.getIconsByCategory(category);
    
    return categoryIcons.length > 0 ? categoryIcons[0].component : null;
  }

  /**
   * Get usage statistics for icons
   */
  getIconStats(): Record<string, { usageCount: number; lastUsed: Date }> {
    // Implementation would track usage statistics
    // For now, return empty object
    return {};
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.icons.clear();
    this.searchIndex.clear();
    this.categoryIndex.clear();
  }

  /**
   * Export registry data for persistence
   */
  export(): { icons: IconRegistryEntry[]; timestamp: string } {
    return {
      icons: Array.from(this.icons.values()),
      timestamp: new Date().toISOString()
    };
  }

  // Private helper methods

  private buildSearchIndex(metadata: IconMetadata): void {
    const terms = [
      metadata.name.toLowerCase(),
      metadata.description.toLowerCase(),
      ...metadata.keywords.map(k => k.toLowerCase()),
      ...metadata.tags.map(t => t.toLowerCase()),
      metadata.category.toLowerCase()
    ];

    terms.forEach(term => {
      // Index whole term
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(metadata.id);

      // Index partial terms (for substring matching)
      for (let i = 1; i <= term.length; i++) {
        const partial = term.substring(0, i);
        if (!this.searchIndex.has(partial)) {
          this.searchIndex.set(partial, new Set());
        }
        this.searchIndex.get(partial)!.add(metadata.id);
      }
    });
  }

  private buildCategoryIndex(metadata: IconMetadata): void {
    if (!this.categoryIndex.has(metadata.category)) {
      this.categoryIndex.set(metadata.category, new Set());
    }
    this.categoryIndex.get(metadata.category)!.add(metadata.id);
  }

  private getExactSubjectMapping(subjectName: string): string | null {
    // Comprehensive subject to icon mapping
    const subjectMappings: Record<string, string> = {
      // Professional Certifications
      'PMP Certification': 'pmp',
      'AWS Cloud Practitioner': 'aws',
      'AWS Solutions Architect': 'aws',
      'AWS Developer': 'aws',
      'AWS SysOps Administrator': 'aws',
      'CompTIA Security+': 'comptia',
      'CompTIA Network+': 'comptia',
      'CompTIA A+': 'comptia',
      'Cisco CCNA': 'cisco',
      'Cisco CCNP': 'cisco',
      'Azure Fundamentals': 'azure',
      'Azure Administrator': 'azure',
      'Google Cloud Professional': 'google-cloud',
      'Oracle Database': 'oracle',
      'VMware vSphere': 'vmware',
      'Kubernetes Administrator': 'kubernetes',
      'Docker Certified Associate': 'docker',
      
      // Computer Science & Technology
      'Programming': 'code',
      'Data Structures': 'algorithm',
      'Algorithms': 'algorithm',
      'Computer Science': 'computer-science',
      'Web Development': 'web-dev',
      'Database Design': 'database',
      'Computer Science Fundamentals': 'computer-science',
      
      // Mathematics & Statistics
      'Mathematics': 'mathematics',
      'Calculus': 'calculus',
      'Linear Algebra': 'linear-algebra',
      'Discrete Mathematics': 'discrete-math',
      'Geometry': 'geometry',
      'Pre-Calculus': 'pre-calculus',
      'Statistics': 'statistics',
      'AP Statistics': 'statistics',
      'Biostatistics': 'biostatistics',
      'Business Statistics': 'business-statistics',
      'Elementary Statistics': 'statistics',
      'Intro to Statistics': 'statistics',
      
      // Natural Sciences
      'Physics': 'physics',
      'Chemistry': 'chemistry',
      'Biology': 'biology',
      'Astronomy': 'astronomy',
      'Earth Science': 'earth-science',
      
      // Engineering
      'Engineering': 'engineering',
      'Mechanical Engineering': 'mechanical-engineering',
      'Electrical Engineering': 'electrical-engineering',
      
      // Business & Economics
      'Business': 'business',
      'Accounting': 'accounting',
      'Economics': 'economics',
      'Finance': 'finance',
      'Business Administration': 'business-admin',
      
      // Medical & Health Sciences
      'Nursing': 'nursing',
      'Pharmacology': 'pharmacology',
      'Medical Sciences': 'medical',
      'Health Sciences': 'health-sciences',
      'Anatomy': 'anatomy',
      'HESI': 'medical-test',
      'TEAS': 'medical-test',
      
      // Social Sciences & Liberal Arts
      'Psychology': 'psychology',
      'History': 'history',
      'Philosophy': 'philosophy',
      'Sociology': 'sociology',
      'Political Science': 'political-science',
      'English': 'literature',
      'Writing': 'writing',
      
      // Test Preparation
      'GRE': 'test-prep',
      'LSAT': 'law-test',
      'TOEFL': 'language-test',
      'GED': 'test-prep'
    };

    return subjectMappings[subjectName] || null;
  }

  private inferCategoryFromSubject(subjectName: string): IconCategory {
    const name = subjectName.toLowerCase();
    
    if (name.includes('aws') || name.includes('azure') || name.includes('cloud') || 
        name.includes('comptia') || name.includes('cisco') || name.includes('certification')) {
      return 'certification';
    }
    
    if (name.includes('math') || name.includes('calculus') || name.includes('algebra') || 
        name.includes('statistics') || name.includes('geometry')) {
      return 'mathematics';
    }
    
    if (name.includes('programming') || name.includes('computer') || name.includes('data structures') ||
        name.includes('web') || name.includes('database')) {
      return 'technology';
    }
    
    if (name.includes('business') || name.includes('economics') || name.includes('finance') ||
        name.includes('accounting')) {
      return 'business';
    }
    
    if (name.includes('medical') || name.includes('nursing') || name.includes('health') ||
        name.includes('anatomy') || name.includes('hesi') || name.includes('teas')) {
      return 'medical';
    }
    
    if (name.includes('physics') || name.includes('chemistry') || name.includes('biology') ||
        name.includes('science') || name.includes('astronomy')) {
      return 'science';
    }
    
    if (name.includes('engineering') || name.includes('mechanical') || name.includes('electrical')) {
      return 'engineering';
    }
    
    if (name.includes('psychology') || name.includes('history') || name.includes('philosophy') ||
        name.includes('sociology') || name.includes('political')) {
      return 'social';
    }
    
    if (name.includes('english') || name.includes('writing') || name.includes('language') ||
        name.includes('toefl')) {
      return 'language';
    }
    
    if (name.includes('gre') || name.includes('lsat') || name.includes('ged') || name.includes('test')) {
      return 'test-prep';
    }
    
    return 'academic';
  }
}

// Singleton instance
export const iconRegistry = new IconRegistry();