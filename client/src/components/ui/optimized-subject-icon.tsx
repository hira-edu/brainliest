/**
 * Optimized Subject Icon Component
 * High-performance icon rendering with caching and preloading
 */

import { useState, useEffect, useMemo } from 'react';
import { optimizedIconService, IconCacheEntry } from '../../services/optimized-icon-service';

interface OptimizedSubjectIconProps {
  subjectName: string;
  subjectSlug?: string;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
  onLoadComplete?: (success: boolean) => void;
}

export function OptimizedSubjectIcon({
  subjectName,
  subjectSlug,
  size = 24,
  className = '',
  fallback,
  onLoadComplete
}: OptimizedSubjectIconProps) {
  const [iconEntry, setIconEntry] = useState<IconCacheEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use slug or derive from name
  const resolvedSlug = useMemo(() => {
    return subjectSlug || subjectName.toLowerCase().replace(/\s+/g, '-');
  }, [subjectSlug, subjectName]);

  useEffect(() => {
    let isMounted = true;

    const loadIcon = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const entry = await optimizedIconService.getIconForSubject(resolvedSlug);
        
        if (isMounted) {
          setIconEntry(entry);
          setIsLoading(false);
          onLoadComplete?.(!!entry);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load icon');
          setIsLoading(false);
          onLoadComplete?.(false);
        }
      }
    };

    loadIcon();

    return () => {
      isMounted = false;
    };
  }, [resolvedSlug, onLoadComplete]);

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading icon"
      />
    );
  }

  // Show error or fallback
  if (error || !iconEntry) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div 
        className={`bg-gray-100 rounded flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        title={`No icon available for ${subjectName}`}
      >
        <span className="text-xs text-gray-500">
          {subjectName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Render SVG icon
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={`${subjectName} (${iconEntry.source})`}
      dangerouslySetInnerHTML={{
        __html: iconEntry.svgContent.replace(
          /<svg([^>]*)>/,
          `<svg$1 width="${size}" height="${size}" viewBox="0 0 100 100">`
        )
      }}
    />
  );
}

/**
 * Higher-order component for batch icon preloading
 */
interface IconPreloaderProps {
  subjects: Array<{ name: string; slug?: string }>;
  children: React.ReactNode;
  onPreloadComplete?: () => void;
}

export function IconPreloader({ subjects, children, onPreloadComplete }: IconPreloaderProps) {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const preloadIcons = async () => {
      try {
        await optimizedIconService.initialize();
        
        // Convert subjects to format expected by prefetch
        const subjectData = subjects.map(s => ({
          name: s.name,
          slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
          description: '',
          icon: '',
          color: '',
          categorySlug: null,
          subcategorySlug: null,
          examCount: 0,
          questionCount: 0
        }));
        
        await optimizedIconService.prefetchSubjectIcons(subjectData);
        setIsPreloading(false);
        onPreloadComplete?.();
      } catch (error) {
        console.warn('Icon preloading failed:', error);
        setIsPreloading(false);
        onPreloadComplete?.();
      }
    };

    preloadIcons();
  }, [subjects, onPreloadComplete]);

  if (isPreloading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading icons...</span>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Performance monitoring hook
 */
export function useIconPerformance() {
  const [metrics, setMetrics] = useState(optimizedIconService.getPerformanceMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(optimizedIconService.getPerformanceMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
}