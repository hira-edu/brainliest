/**
 * Icon Definitions Index
 * Lazy-loaded icon definitions for optimal performance
 */

import { iconRegistry } from '../registry';

/**
 * Register all icons in the system
 * Uses dynamic imports for code splitting
 */
export async function registerAllIcons(): Promise<void> {
  try {
    // Import all icon definition modules
    const [
      certificationIcons,
      academicIcons,
      technologyIcons,
      generalIcons,
      azureIcons
    ] = await Promise.all([
      import('./certification-icons'),
      import('./academic-icons'),
      import('./technology-icons'),
      import('./general-icons'),
      import('./azure-icons')
    ]);

    // Register all icon sets
    iconRegistry.registerIcons([
      ...certificationIcons.icons,
      ...academicIcons.icons,
      ...technologyIcons.icons,
      ...generalIcons.icons,
      ...azureIcons.icons
    ]);


  } catch (error) {
    console.error('Failed to register icons:', error);
    throw error;
  }
}

/**
 * Get icon definition module by category
 */
export async function getIconsByCategory(category: string) {
  switch (category) {
    case 'certification':
      return (await import('./certification-icons')).icons;
    case 'academic':
      return (await import('./academic-icons')).icons;
    case 'technology':
      return (await import('./technology-icons')).icons;
    case 'general':
      return (await import('./general-icons')).icons;
    default:
      return [];
  }
}

/**
 * Preload critical icons for immediate availability
 */
export async function preloadCriticalIcons(): Promise<void> {
  const criticalIconIds = [
    'pmp', 'aws', 'comptia', 'cisco', 'azure',
    'mathematics', 'statistics', 'science', 'business', 'engineering'
  ];

  // Import certification icons first (most commonly used)
  const { icons } = await import('./certification-icons');
  const criticalIcons = icons.filter(icon => 
    criticalIconIds.includes(icon.metadata.id)
  );
  
  iconRegistry.registerIcons(criticalIcons);
}