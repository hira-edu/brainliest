/**
 * Icon Provider - Context provider for icon system
 * Manages icon state, configuration, and provides icon access throughout app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IconContextValue, IconConfig, IconCategory, IconRegistryEntry } from './types';
import { iconRegistry } from './registry';

// Default configuration
const DEFAULT_CONFIG: IconConfig = {
  defaultSize: 'md',
  defaultColor: 'current',
  defaultVariant: 'filled',
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

  // Initialize icon registry
  useEffect(() => {
    const initializeIcons = async () => {
      try {
        // Dynamic import of icon definitions to enable code splitting
        const { registerAllIcons } = await import('./definitions');
        await registerAllIcons();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize icon system:', error);
        setIsInitialized(true); // Set to true even on error to prevent infinite loading
      }
    };

    initializeIcons();
  }, []);

  // Context value implementation
  const contextValue: IconContextValue = {
    getIcon: (id: string) => {
      if (!isInitialized) return null;
      return iconRegistry.getIcon(id);
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
 * Hook to get a specific icon
 */
export function useIcon(id: string) {
  const context = useIcons();
  
  // Compute values synchronously to avoid hook inconsistencies
  const component = context.getIcon(id);
  const metadata = context.getIconMetadata(id);
  
  return {
    component,
    metadata,
    loading: false
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
 * Hook to get subject-specific icons
 */
export function useSubjectIcon(subjectName: string) {
  const { getIcon } = useIcons();
  const [subjectIcon, setSubjectIcon] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Use the registry's subject mapping logic
    const icon = iconRegistry.getIconForSubject(subjectName);
    setSubjectIcon(() => icon);
  }, [subjectName, getIcon]);

  return subjectIcon;
}

/**
 * Hook for icon metrics and analytics
 */
export function useIconMetrics() {
  const [metrics, setMetrics] = useState({
    totalIcons: 0,
    categoryCounts: {} as Record<IconCategory, number>,
    popularIcons: [] as string[],
    recentlyUsed: [] as string[]
  });

  useEffect(() => {
    // Implementation would track and provide icon usage metrics
    // For now, return basic statistics
    const allIds = iconRegistry.getAllIconIds();
    
    setMetrics({
      totalIcons: allIds.length,
      categoryCounts: {} as Record<IconCategory, number>,
      popularIcons: allIds.slice(0, 10),
      recentlyUsed: []
    });
  }, []);

  return metrics;
}