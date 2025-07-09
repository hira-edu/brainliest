/**
 * Icon System Main Export
 * Re-exports all icon system components with proper type exports
 * Fixes audit issue: Missing type exports
 */

"use client";

// Component exports
export { Icon, SubjectIcon, CategoryIcon, StatusIcon } from './icon';
export { BaseIcon, LoadingIcon, FallbackIcon, createIcon } from './base-icon';
export { IconProvider, useIcons, useIcon, useIconSearch, useSubjectIcon, useIconMetrics } from './icon-provider';

// Registry exports
export { iconRegistry, sharedIconRegistry, industrialIconRegistry } from './shared-registry';
export { IconRegistry } from './registry';
export { IndustrialIconRegistry } from './industrial-registry';

// Type exports - Fixed: Re-export for convenience
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
export { iconLazyLoader } from './lazy-loader';
export type { IconLazyLoader } from './lazy-loader';

// Definition exports
export { registerAllIcons } from './definitions';