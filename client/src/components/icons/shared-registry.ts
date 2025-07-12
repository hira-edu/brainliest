/**
 * Shared Icon Registry - Centralized registry for icon system
 * Fixes audit issue: Registry dependency conflicts
 */

import { iconRegistry as originalIconRegistry } from './registry';

// Create singleton shared registry to prevent conflicts
export const sharedIconRegistry = originalIconRegistry;

// Re-export for compatibility
export { sharedIconRegistry as iconRegistry };
export { sharedIconRegistry as industrialIconRegistry };

// Initialize critical icons immediately
export async function initializeSharedRegistry(): Promise<void> {
  try {
    // Import and register all icon definitions
    const definitionsModule = await import('./definitions');
    if (definitionsModule.registerAllIcons) {
      await definitionsModule.registerAllIcons();
    }
  } catch (error) {
    console.error('Failed to initialize shared icon registry:', error);
  }
}

// Export registry methods for direct access
export const getIcon = (id: string) => sharedIconRegistry.getIcon(id);
export const hasIcon = (id: string) => sharedIconRegistry.hasIcon(id);
export const searchIcons = (query: string, category?: any) => sharedIconRegistry.searchIcons(query, category);
export const getIconForSubject = (subjectName: string) => sharedIconRegistry.getIconForSubject(subjectName);