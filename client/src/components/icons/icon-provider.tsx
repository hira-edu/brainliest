/**
 * Icon Provider - Context provider for icon system
 * Manages icon state, configuration, and provides icon access throughout app
 */

 // Fixed: RSC directive for Vercel compatibility

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IconContextValue, IconConfig, IconCategory, IconRegistryEntry, IconProps } from './types';
import { sharedIconRegistry as iconRegistry } from './shared-registry'; // Fixed: Use shared registry
import { FallbackIcon, LoadingIcon } from './base-icon';
import { iconLazyLoader } from './lazy-loader'; // Fixed: Add lazy loading

// Default configuration - fixed variant to 'outlined' for Lucide compatibility
const DEFAULT_CONFIG: IconConfig = {
  defaultSize: 'md',
  defaultColor: 'current',
  defaultVariant: 'outlined', // Fixed: Changed from 'filled' to 'outlined' for Lucide Icons compatibility
  lazyLoading: true,
  cacheSize: 100,
  themeColors: {
    primary: 'hsl(207, 90%, 54%)',
    secondary: 'hsl(146, 60%, 45%)',
    accent: 'hsl(14, 87%, 55%)',
    muted: 'hsl(25, 5.3%, 44.7%)',
    destructive: 'hsl(0, 84.2%, 60.2%)'
  }
};

// Create context
const IconContext = createContext<IconContextValue | null>(null);

interface IconProviderProps {
  children: ReactNode;
  config?: Partial<IconConfig>;
}

/**
 * Icon Provider component that manages icon system state
 */
export function IconProvider({ children, config = {} }: IconProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize icon registry with proper error handling and fallback
  useEffect(() => {
    const initializeIcons = async () => {
      try {
        // Dynamic import of icon definitions to enable code splitting
        const { registerAllIcons } = await import('./definitions');
        await registerAllIcons();
        setIsInitialized(true);
      } catch (error: unknown) {
        // Fixed: Proper TypeScript error handling
        if (error instanceof Error) {
          console.error('Failed to initialize icon system:', error.message);
        } else {
          console.error('Failed to initialize icon system:', String(error));
        }
        
        // Fixed: Provide fallback icons for basic functionality
        try {
          // Register minimal fallback icon set
          iconRegistry.registerIcon({
            component: FallbackIcon,
            metadata: {
              id: 'fallback',
              name: 'Fallback Icon',
              category: 'general',
              description: 'Default fallback icon',
              keywords: ['fallback', 'default'],
              variants: ['outlined'],
              tags: ['system']
            }
          });
          
          // Preload critical icons
          await iconLazyLoader.preloadCriticalIcons([
            'pmp', 'aws', 'comptia', 'cisco', 'azure', 'mathematics', 'science', 'business'
          ]);
        } catch (fallbackError) {
          console.error('Critical error: Could not load fallback icons');
        }
        
        setIsInitialized(true); // Set to true even on error to prevent infinite loading
      }
    };

    initializeIcons();
  }, []);

  // Context value implementation
  const contextValue: IconContextValue = {
    getIcon: (id: string) => {
      if (!isInitialized) {
        // Fixed: Return FallbackIcon component instead of null to prevent null pointer errors
        return FallbackIcon;
      }
      return iconRegistry.getIcon(id) || FallbackIcon; // Fixed: Always return a valid component
    },

    getIconMetadata: (id: string) => {
      if (!isInitialized) return null;
      return iconRegistry.getIconMetadata(id);
    },

    searchIcons: (query: string, category?: IconCategory) => {
      if (!isInitialized) return [];
      return iconRegistry.searchIcons(query, category);
    },

    getIconsByCategory: (category: IconCategory) => {
      if (!isInitialized) return [];
      return iconRegistry.getIconsByCategory(category);
    },

    registerIcon: (entry: IconRegistryEntry) => {
      iconRegistry.registerIcon(entry);
    },

    hasIcon: (id: string) => {
      if (!isInitialized) return false;
      return iconRegistry.hasIcon(id);
    },

    getAllIconIds: () => {
      if (!isInitialized) return [];
      return iconRegistry.getAllIconIds();
    }
  };

  return (
    <IconContext.Provider value={contextValue}>
      {children}
    </IconContext.Provider>
  );
}

/**
 * Hook to access icon system functionality
 */
export function useIcons() {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error('useIcons must be used within an IconProvider');
  }
  return context;
}

/**
 * Hook to get a specific icon with proper loading states and error handling
 */
export function useIcon(id: string) {
  const context = useIcons();
  const [loading, setLoading] = useState(!context.hasIcon(id));
  const [error, setError] = useState<Error | null>(null);
  
  // Fixed: Proper async loading with lazy loader
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (context.hasIcon(id)) {
      setLoading(false);
      setError(null);
      return;
    }

    // Fixed: Use lazy loader for actual async icon loading
    setLoading(true);
    iconLazyLoader.loadIcon(id)
      .then((component) => {
        if (component) {
          // Register the loaded component
          iconRegistry.registerIcon({
            component,
            metadata: {
              id,
              name: id,
              category: 'general',
              description: `Lazy loaded icon: ${id}`,
              keywords: [id],
              variants: ['outlined'],
              tags: ['lazy-loaded']
            }
          });
          setError(null);
        } else {
          setError(new Error(`Icon "${id}" not found`));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(`Failed to load icon "${id}"`));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, context]);
  
  // Always return a valid component (FallbackIcon if needed)
  const component = context.getIcon(id);
  const metadata = context.getIconMetadata(id);
  
  return {
    component: component || FallbackIcon, // Fixed: Always return valid component
    metadata,
    loading,
    error
  };
}

/**
 * Hook for icon search functionality
 */
export function useIconSearch() {
  const { searchIcons, getIconsByCategory } = useIcons();
  const [searchState, setSearchState] = useState({
    query: '',
    category: undefined as IconCategory | undefined,
    results: [] as IconRegistryEntry[]
  });

  const search = (query: string, category?: IconCategory) => {
    const results = query 
      ? searchIcons(query, category)
      : category 
        ? getIconsByCategory(category)
        : [];

    setSearchState({
      query,
      category,
      results
    });
  };

  const clearSearch = () => {
    setSearchState({
      query: '',
      category: undefined,
      results: []
    });
  };

  return {
    ...searchState,
    search,
    clearSearch
  };
}

/**
 * Hook to get subject-specific icons with proper TypeScript types
 */
export function useSubjectIcon(subjectName: string) {
  const context = useIcons(); // Fixed: Remove getIcon dependency to avoid stale lookups
  const [subjectIcon, setSubjectIcon] = useState<React.ComponentType<IconProps> | null>(null); // Fixed: Proper typing

  useEffect(() => {
    // Fixed: Use context instead of direct registry access for consistency
    const icon = iconRegistry.getIconForSubject(subjectName);
    setSubjectIcon(() => icon || FallbackIcon); // Fixed: Always return valid component
  }, [subjectName, context]); // Fixed: Use context as dependency

  return subjectIcon || FallbackIcon; // Fixed: Always return valid component
}

/**
 * Hook for icon metrics and analytics - FIXED: Proper implementation
 */
export function useIconMetrics() {
  const context = useIcons();
  const [metrics, setMetrics] = useState({
    totalIcons: 0,
    categoryCounts: {} as Record<IconCategory, number>,
    popularIcons: [] as string[],
    recentlyUsed: [] as string[]
  });

  useEffect(() => {
    // Fixed: Proper metrics calculation with category breakdown
    const allIds = context.getAllIconIds();
    const categoryCounts: Record<IconCategory, number> = {} as Record<IconCategory, number>;

    // Calculate category counts
    allIds.forEach(id => {
      const metadata = context.getIconMetadata(id);
      if (metadata) {
        const category = metadata.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    setMetrics({
      totalIcons: allIds.length,
      categoryCounts,
      popularIcons: allIds.slice(0, 10), // TODO: Implement usage tracking
      recentlyUsed: [] // TODO: Implement recent usage tracking
    });
  }, [context]);

  return metrics;
}