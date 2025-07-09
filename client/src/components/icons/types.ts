/**
 * Icon System Type Definitions
 * Modern TypeScript-first icon system with comprehensive type safety
 */

import { ComponentType, SVGProps } from 'react';

// Base icon component props with comprehensive customization options
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Icon size - supports predefined sizes or custom values */
  size?: IconSize | number | string;
  /** Icon color - supports theme colors, hex, or CSS variables */
  color?: IconColor | string;
  /** Icon variant for different visual styles */
  variant?: IconVariant;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** Icon title for tooltips */
  title?: string;
  /** Custom CSS class names */
  className?: string;
  /** Loading state indicator */
  loading?: boolean;
  /** Interactive state styling */
  interactive?: boolean;
}

// Predefined icon sizes following design system
export type IconSize = 
  | 'xs'    // 12px
  | 'sm'    // 16px  
  | 'md'    // 20px
  | 'lg'    // 24px
  | 'xl'    // 32px
  | '2xl'   // 48px
  | '3xl'   // 64px;

// Theme-aware color system
export type IconColor =
  | 'primary'
  | 'secondary' 
  | 'accent'
  | 'muted'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'foreground'
  | 'background'
  | 'current'; // Uses currentColor

// Icon visual variants
export type IconVariant =
  | 'filled'     // Solid/filled version
  | 'outlined'   // Outline/stroke version
  | 'light'      // Light weight version
  | 'bold'       // Bold/thick version
  | 'duotone';   // Two-tone version

// Icon categories for organization
export type IconCategory =
  | 'certification'   // Professional certifications
  | 'academic'       // Academic subjects
  | 'technology'     // Tech/cloud platforms
  | 'business'       // Business/finance
  | 'medical'        // Healthcare/medical
  | 'science'        // Natural sciences
  | 'mathematics'    // Math/statistics
  | 'engineering'    // Engineering disciplines
  | 'social'         // Social sciences
  | 'language'       // Languages/communication
  | 'test-prep'      // Standardized tests
  | 'general';       // General purpose icons

// Icon metadata for rich information
export interface IconMetadata {
  /** Unique identifier for the icon */
  id: string;
  /** Display name for the icon */
  name: string;
  /** Icon category for organization */
  category: IconCategory;
  /** Icon description for accessibility */
  description: string;
  /** Keywords for search functionality */
  keywords: string[];
  /** Brand colors associated with the icon */
  brandColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  /** Icon variants available */
  variants: IconVariant[];
  /** Tags for filtering */
  tags: string[];
  /** Icon source/attribution */
  source?: string;
  /** Whether this is an official brand icon */
  official?: boolean;
}

// Icon component type definition
export type IconComponent = ComponentType<IconProps>;

// Icon registry entry combining component and metadata
export interface IconRegistryEntry {
  component: IconComponent;
  metadata: IconMetadata;
}

// Icon provider context interface
export interface IconContextValue {
  /** Get icon component by ID */
  getIcon: (id: string) => IconComponent | null;
  /** Get icon metadata by ID */
  getIconMetadata: (id: string) => IconMetadata | null;
  /** Search icons by query */
  searchIcons: (query: string, category?: IconCategory) => IconRegistryEntry[];
  /** Get all icons in a category */
  getIconsByCategory: (category: IconCategory) => IconRegistryEntry[];
  /** Register a new icon */
  registerIcon: (entry: IconRegistryEntry) => void;
  /** Check if icon exists */
  hasIcon: (id: string) => boolean;
  /** Get all available icon IDs */
  getAllIconIds: () => string[];
}

// Icon configuration options
export interface IconConfig {
  /** Default icon size */
  defaultSize: IconSize;
  /** Default icon color */
  defaultColor: IconColor;
  /** Default icon variant */
  defaultVariant: IconVariant;
  /** Enable lazy loading */
  lazyLoading: boolean;
  /** Icon cache size limit */
  cacheSize: number;
  /** Custom theme colors */
  themeColors?: Record<string, string>;
  /** Enable metrics collection */
  enableMetrics?: boolean;
  /** Enable debug logging */
  enableDebug?: boolean;
  /** Search timeout in ms */
  searchTimeout?: number;
  /** Cache eviction strategy */
  evictionStrategy?: 'lru' | 'fifo';
}

// Subject to icon mapping interface
export interface SubjectIconMapping {
  /** Subject name (exact match) */
  subjectName: string;
  /** Icon ID to use */
  iconId: string;
  /** Fallback icon if primary not available */
  fallbackIconId?: string;
  /** Category override */
  categoryOverride?: IconCategory;
}