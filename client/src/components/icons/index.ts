/**
 * Icon System Public API
 * Main entry point for the icon system
 */

// Core exports
export { Icon, SubjectIcon, CategoryIcon, StatusIcon } from './icon';
export { IconProvider, useIcons, useIcon, useIconSearch, useSubjectIcon } from './icon-provider';
export { BaseIcon, createIcon, LoadingIcon, FallbackIcon } from './base-icon';
export { iconRegistry } from './registry';

// Type exports
export type {
  IconProps,
  IconSize,
  IconColor,
  IconVariant,
  IconCategory,
  IconMetadata,
  IconComponent,
  IconRegistryEntry,
  IconContextValue,
  IconConfig,
  SubjectIconMapping
} from './types';

// Utility exports
export { registerAllIcons, preloadCriticalIcons } from './definitions';

// Legacy compatibility (for gradual migration)
export { Icon as default } from './icon';