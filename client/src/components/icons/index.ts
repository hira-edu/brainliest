/**
 * Icon System Public API
 * Main entry point for the icon system
 * 
 * Provides all core components, hooks, utilities, and types for working
 * with the icon registry in a robust, lazy-loaded, and fallback-aware way.
 */

// Core components
export { Icon, SubjectIcon, CategoryIcon, StatusIcon } from './icon';

// Provider & hooks
export {
  IconProvider,
  useIcons,
  useIcon,
  useIconSearch,
  useSubjectIcon,
} from './icon-provider';

// Base primitives
export {
  BaseIcon,
  createIcon,
  LoadingIcon,
  FallbackIcon,
} from './base-icon';

// Registry (underlying storage & lookup)
export { iconRegistry } from './registry';

// Utility functions
export {
  preloadCriticalIcons,
  registerAllIcons,
} from './definitions';

// Types
export type {
  IconCategory,
  IconColor,
  IconComponent,
  IconConfig,
  IconContextValue,
  IconMetadata,
  IconProps,
  IconRegistryEntry,
  IconSize,
  IconVariant,
  SubjectIconMapping,
} from './types';

// Legacy compatibility (default export)
export { Icon as default } from './icon';
