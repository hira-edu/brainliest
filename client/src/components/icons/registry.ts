import {
  IconRegistryEntry,
  IconComponent,
  IconMetadata,
  IconCategory,
  SubjectIconMapping,
} from './types';

class IconRegistry {
  private icons = new Map<string, IconRegistryEntry>();
  private searchIndex = new Map<string, Set<string>>();
  private categoryIndex = new Map<IconCategory, Set<string>>();

  /** Normalize IDs for case- and whitespace-insensitive lookup */
  private normalizeId(id: string): string {
    return id.trim().toLowerCase();
  }

  /**
   * Register a new icon in the registry
   */
  registerIcon(entry: IconRegistryEntry): void {
    const { metadata } = entry;
    const key = this.normalizeId(metadata.id);

    // Warn if overwriting an existing icon
    if (this.icons.has(key)) {
      console.warn(`IconRegistry: Overwriting icon with id '${metadata.id}'`);
    }

    // Store the icon under normalized key
    this.icons.set(key, entry);

    // Update indexes
    this.buildSearchIndex(metadata, key);
    this.buildCategoryIndex(metadata, key);
  }

  /**
   * Register multiple icons at once
   */
  registerIcons(entries: IconRegistryEntry[]): void {
    entries.forEach(entry => this.registerIcon(entry));
  }

  /**
   * Get icon component by ID (null if not found)
   */
  getIcon(id: string): IconComponent | null {
    const key = this.normalizeId(id);
    return this.icons.get(key)?.component ?? null;
  }

  /**
   * Get icon metadata by ID (null if not found)
   */
  getIconMetadata(id: string): IconMetadata | null {
    const key = this.normalizeId(id);
    return this.icons.get(key)?.metadata ?? null;
  }

  /**
   * Check if icon exists
   */
  hasIcon(id: string): boolean {
    return this.icons.has(this.normalizeId(id));
  }

  /**
   * Get all registered icon IDs (original metadata IDs)
   */
  getAllIconIds(): string[] {
    return Array.from(this.icons.values()).map(entry => entry.metadata.id);
  }

  /**
   * Search icons by multi-term query, optionally filtering by category
   */
  searchIcons(query: string, category?: IconCategory): IconRegistryEntry[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // No query: return by category or empty
      return category ? this.getIconsByCategory(category) : [];
    }

    // Split into tokens and intersect result sets
    const tokens = trimmed.split(/\s+/);
    let resultIds: Set<string> | null = null;
    for (const token of tokens) {
      const ids = this.searchIndex.get(token) ?? new Set();
      if (resultIds === null) {
        resultIds = new Set(ids);
      } else {
        // intersection
        for (const id of Array.from(resultIds)) {
          if (!ids.has(id)) resultIds.delete(id);
        }
      }
      if (resultIds.size === 0) break;
    }
    const matches = resultIds
      ? Array.from(resultIds)
          .map(k => this.icons.get(k))
          .filter((e): e is IconRegistryEntry => !!e)
      : [];

    // Filter by category if requested
    const filtered = category
      ? matches.filter(e => e.metadata.category === category)
      : matches;

    // Sort by relevance: exact name > prefix > alphabetical
    const cq = trimmed;
    return filtered.sort((a, b) => {
      const aName = a.metadata.name.toLowerCase();
      const bName = b.metadata.name.toLowerCase();
      const aExact = aName === cq;
      const bExact = bName === cq;
      if (aExact !== bExact) return aExact ? -1 : 1;
      const aStarts = aName.startsWith(cq);
      const bStarts = bName.startsWith(cq);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return aName.localeCompare(bName);
    });
  }

  /**
   * Get all icons in a specific category
   */
  getIconsByCategory(category: IconCategory): IconRegistryEntry[] {
    const ids = this.categoryIndex.get(category) ?? new Set();
    return Array.from(ids)
      .map(k => this.icons.get(k))
      .filter((e): e is IconRegistryEntry => !!e)
      .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
  }

  /**
   * Get icons by multiple categories (union)
   */
  getIconsByCategories(categories: IconCategory[]): IconRegistryEntry[] {
    const unique = new Map<string, IconRegistryEntry>();
    categories.forEach(cat => {
      this.getIconsByCategory(cat).forEach(e => unique.set(e.metadata.id, e));
    });
    return Array.from(unique.values()).sort((a, b) =>
      a.metadata.name.localeCompare(b.metadata.name),
    );
  }

  /**
   * Get suggested icon component based on subject name
   */
  getIconForSubject(subjectName: string): IconComponent | null {
    // 1) Exact mapping
    const exact = this.getExactSubjectMapping(subjectName);
    if (exact && this.hasIcon(exact)) {
      return this.getIcon(exact);
    }

    // 2) Fuzzy search
    const fuzzy = this.searchIcons(subjectName);
    if (fuzzy.length > 0) {
      return fuzzy[0].component;
    }

    // 3) Category inference fallback
    const category = this.inferCategoryFromSubject(subjectName);
    const byCategory = this.getIconsByCategory(category);
    return byCategory.length > 0 ? byCategory[0].component : null;
  }

  /**
   * Clear registry and indexes
   */
  clear(): void {
    this.icons.clear();
    this.searchIndex.clear();
    this.categoryIndex.clear();
  }

  /**
   * Export registry snapshot
   */
  export(): { icons: IconRegistryEntry[]; timestamp: string } {
    return {
      icons: Array.from(this.icons.values()),
      timestamp: new Date().toISOString(),
    };
  }

  // ——— Private helpers ———

  private buildSearchIndex(meta: IconMetadata, idKey: string): void {
    const terms = new Set<string>([
      ...meta.name.toLowerCase().split(/\W+/),
      ...meta.description.toLowerCase().split(/\W+/),
      ...meta.keywords.map(k => k.toLowerCase()),
      ...meta.tags.map(t => t.toLowerCase()),
      meta.category.toLowerCase(),
    ]);

    for (const term of terms) {
      if (!term) continue;
      if (!this.searchIndex.has(term)) this.searchIndex.set(term, new Set());
      this.searchIndex.get(term)!.add(idKey);
    }
  }

  private buildCategoryIndex(meta: IconMetadata, idKey: string): void {
    const cat = meta.category;
    if (!this.categoryIndex.has(cat)) {
      this.categoryIndex.set(cat, new Set());
    }
    this.categoryIndex.get(cat)!.add(idKey);
  }

  private getExactSubjectMapping(subjectName: string): string | null {
    const m: SubjectIconMapping = {
      // ... your mapping entries ...
      'PMP Certification': 'pmp',
      'AWS Cloud Practitioner': 'aws',
      // etc.
    };
    return m[subjectName] ?? null;
  }

  private inferCategoryFromSubject(subjectName: string): IconCategory {
    const n = subjectName.toLowerCase();
    if (/(aws|azure|cloud|comptia|cisco|certification)/.test(n)) {
      return 'certification';
    }
    if (/(math|calculus|algebra|statistics|geometry)/.test(n)) {
      return 'mathematics';
    }
    if (/(programming|computer|web|database|data structures)/.test(n)) {
      return 'technology';
    }
    if (/(business|economics|finance|accounting)/.test(n)) {
      return 'business';
    }
    if (/(medical|nursing|health|pharmacology|hesi|teas)/.test(n)) {
      return 'medical';
    }
    if (/(physics|chemistry|biology|science|astronomy)/.test(n)) {
      return 'science';
    }
    if (/(engineering|mechanical|electrical)/.test(n)) {
      return 'engineering';
    }
    if (/(psychology|history|philosophy|sociology|political)/.test(n)) {
      return 'social';
    }
    if (/(english|writing|language|toefl)/.test(n)) {
      return 'language';
    }
    if (/(gre|lsat|ged|test)/.test(n)) {
      return 'test-prep';
    }
    return 'academic';
  }
}

// Singleton instance
export const iconRegistry = new IconRegistry();
