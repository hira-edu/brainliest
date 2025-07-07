/**
 * Legacy Icon Mapping
 * Provides backward compatibility for existing icon references
 */

import { iconRegistry } from '../registry';

/**
 * Legacy function for backward compatibility
 * Maintains existing API while using new icon system internally
 */
export function getIconComponent(subjectName: string) {
  return iconRegistry.getIconForSubject(subjectName);
}

/**
 * Legacy CertificationIcons object for backward compatibility
 */
export const CertificationIcons = {
  get pmp() { return iconRegistry.getIcon('pmp'); },
  get aws() { return iconRegistry.getIcon('aws'); },
  get comptia() { return iconRegistry.getIcon('comptia'); },
  get cisco() { return iconRegistry.getIcon('cisco'); },
  get azure() { return iconRegistry.getIcon('azure'); },
  get googlecloud() { return iconRegistry.getIcon('google-cloud'); },
  get oracle() { return iconRegistry.getIcon('oracle'); },
  get vmware() { return iconRegistry.getIcon('vmware'); },
  get kubernetes() { return iconRegistry.getIcon('kubernetes'); },
  get docker() { return iconRegistry.getIcon('docker'); },
  get math() { return iconRegistry.getIcon('mathematics'); },
  get mathematics() { return iconRegistry.getIcon('mathematics'); },
  get statistics() { return iconRegistry.getIcon('statistics'); },
  get science() { return iconRegistry.getIcon('science'); },
  get engineering() { return iconRegistry.getIcon('engineering'); },
  get business() { return iconRegistry.getIcon('business'); },
  get medical() { return iconRegistry.getIcon('medical'); }
};

/**
 * Get all available icon keys (legacy compatibility)
 */
export function getAllIconKeys(): string[] {
  return iconRegistry.getAllIconIds();
}