import React, { Suspense, forwardRef } from 'react';
import { IconProps } from './types';
import { useIcon } from './icon-provider';
import { LoadingIcon, FallbackIcon } from './base-icon';

interface IconComponentProps extends IconProps {
  /** Icon identifier */
  name: string;
  /** Fallback icon if primary icon fails to load */
  fallback?: string;
  /** Show loading state while icon loads */
  showLoading?: boolean;
}

/**
 * Smart icon component with lazy loading and fallback support
 */
export const Icon = forwardRef<SVGSVGElement, IconComponentProps>(
  ({ name, fallback, showLoading = true, ...props }, ref) => {
    // Normalize fallback name so hooks are always called in same order
    const fallbackName = fallback ?? '';

    // Always call hooks consistently
    const {
      component: PrimaryComponent,
      loading: primaryLoading,
      error: primaryError,
    } = useIcon(name);
    const {
      component: FallbackComponent,
      loading: fallbackLoading,
      error: fallbackError,
    } = useIcon(fallbackName);

    // If primary is loading, show loading state
    if (primaryLoading && showLoading) {
      return <LoadingIcon ref={ref} {...props} />;
    }

    // If primary loaded successfully and no error, render it
    if (PrimaryComponent && !primaryError) {
      return (
        <Suspense
          fallback={showLoading ? <LoadingIcon ref={ref} {...props} /> : null}
        >
          <PrimaryComponent ref={ref} {...props} />
        </Suspense>
      );
    }

    // If primary failed or not found, try fallback
    if (fallbackName) {
      // While fallback loading, show loading state
      if (fallbackLoading && showLoading) {
        return <LoadingIcon ref={ref} {...props} />;
      }
      // If fallback loaded successfully, render it
      if (FallbackComponent && !fallbackError) {
        return (
          <Suspense
            fallback={showLoading ? <LoadingIcon ref={ref} {...props} /> : null}
          >
            <FallbackComponent ref={ref} {...props} />
          </Suspense>
        );
      }
    }

    // As a last resort, render the generic fallback icon
    return <FallbackIcon ref={ref} {...props} />;
  }
);

Icon.displayName = 'Icon';

/**
 * Subject-specific icon component
 */
interface SubjectIconProps extends IconProps {
  /** Subject name to find appropriate icon */
  subjectName: string;
  /** Fallback icon if no subject-specific icon found */
  fallback?: string;
}

export const SubjectIcon = forwardRef<SVGSVGElement, SubjectIconProps>(
  ({ subjectName, fallback = 'academic', ...props }, ref) => {
    // Enhanced icon resolution with database support
    const [resolvedIcon, setResolvedIcon] = React.useState<string>(fallback);
    const [isLoading, setIsLoading] = React.useState(false);
    
    React.useEffect(() => {
      async function resolveIcon() {
        if (!subjectName) return;
        
        setIsLoading(true);
        try {
          // First try database lookup using subject name to find slug
          const { apiRequest } = await import('../../services/queryClient');
          const subjects = await apiRequest('/api/subjects');
          const subject = subjects.find((s: any) => s.name === subjectName);
          
          if (subject) {
            // Try database-driven icon
            const { iconService } = await import('../../services/icon-service');
            const dbIcon = await iconService.getIconForSubject(subject.slug);
            
            if (dbIcon) {
              console.log(`✅ Database icon resolved: "${subjectName}" -> "${dbIcon.id}"`);
              setResolvedIcon(dbIcon.id);
              return;
            }
          }
          
          // Fallback to hardcoded mapping
          const hardcodedIcon = useSubjectIconName(subjectName);
          console.log(`⚡ Fallback icon resolved: "${subjectName}" -> "${hardcodedIcon}"`);
          setResolvedIcon(hardcodedIcon);
          
        } catch (error) {
          console.warn(`⚠️ Icon resolution failed for "${subjectName}":`, error);
          setResolvedIcon(fallback);
        } finally {
          setIsLoading(false);
        }
      }
      
      resolveIcon();
    }, [subjectName, fallback]);
    
    if (isLoading) {
      return (
        <div 
          ref={ref} 
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${props.className || 'w-6 h-6'}`}
          style={props.style}
        />
      );
    }
    
    return (
      <Icon
        ref={ref}
        name={resolvedIcon}
        fallback={fallback}
        {...props}
      />
    );
  }
);

SubjectIcon.displayName = 'SubjectIcon';

/**
 * Category icon component for consistent category representation
 */
interface CategoryIconProps extends IconProps {
  /** Category name */
  category: string;
}

export const CategoryIcon = forwardRef<SVGSVGElement, CategoryIconProps>(
  ({ category, ...props }, ref) => {
    const categoryIconMap: Record<string, string> = {
      certification: 'certificate',
      academic: 'graduation-cap',
      technology: 'laptop',
      business: 'briefcase',
      medical: 'stethoscope',
      science: 'flask',
      mathematics: 'calculator',
      engineering: 'cog',
      social: 'users',
      language: 'globe',
      'test-prep': 'clipboard-list',
    };
    const iconName = categoryIconMap[category.toLowerCase()] || 'folder';
    return <Icon ref={ref} name={iconName} {...props} />;
  }
);

CategoryIcon.displayName = 'CategoryIcon';

/**
 * Status icon component for consistent status representation
 */
interface StatusIconProps extends IconProps {
  /** Status type */
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
}

export const StatusIcon = forwardRef<SVGSVGElement, StatusIconProps>(
  ({ status, ...props }, ref) => {
    const statusIconMap: Record<string, string> = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info-circle',
      loading: 'loader',
    };
    const statusColorMap: Record<string, IconProps['color']> = {
      success: 'success',
      error: 'destructive',
      warning: 'warning',
      info: 'info',
      loading: 'muted',
    };
    return (
      <Icon
        ref={ref}
        name={statusIconMap[status]}
        color={statusColorMap[status]}
        loading={status === 'loading'}
        {...props}
      />
    );
  }
);

StatusIcon.displayName = 'StatusIcon';

// Helper hook to get subject icon name - always returns a string
// Database-driven icon resolution hook
function useSubjectIconFromDatabase(subjectSlug: string): string | null {
  const [databaseIcon, setDatabaseIcon] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    async function fetchIcon() {
      if (!subjectSlug) return;
      
      setIsLoading(true);
      try {
        const { iconService } = await import('../../services/icon-service');
        const icon = await iconService.getIconForSubject(subjectSlug);
        setDatabaseIcon(icon?.id || null);
      } catch (error) {
        console.warn('Failed to fetch database icon:', error);
        setDatabaseIcon(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchIcon();
  }, [subjectSlug]);
  
  return databaseIcon;
}

// Fallback to hardcoded mapping if database lookup fails
function useSubjectIconName(subjectName: string): string {
  // Enhanced mapping with exact database names and pattern matching
  const subjectIconMap: Record<string, string> = {
    // Exact database matches
    'PMP Certification': 'pmp',
    'AWS Certified Solutions Architect': 'aws',
    'AWS Cloud Practitioner': 'aws',
    'AWS Solutions Architect': 'aws',
    'AWS Developer': 'aws',
    'AWS SysOps Administrator': 'aws',
    'CompTIA Security+': 'comptia',
    'CompTIA Network+': 'comptia',
    'CompTIA A+': 'comptia',
    'Cisco CCNA': 'cisco',
    'Cisco CCNP': 'cisco',
    'Azure Fundamentals': 'azure',
    'Microsoft Azure Fundamentals': 'azure',
    'Azure Administrator': 'azure',
    'Google Cloud Professional': 'google-cloud',
    'Oracle Database': 'oracle',
    'VMware vSphere': 'vmware',
    'Kubernetes Administrator': 'kubernetes',
    'Docker Certified Associate': 'docker',
    
    // Mathematics subjects
    'Mathematics': 'mathematics',
    'Calculus': 'mathematics',
    'Linear Algebra': 'mathematics',
    'Discrete Mathematics': 'mathematics',
    'Geometry': 'mathematics',
    'Pre-Calculus': 'mathematics',
    
    // Statistics subjects  
    'Statistics': 'statistics',
    'AP Statistics': 'statistics',
    'Biostatistics': 'statistics',
    'Business Statistics': 'statistics',
    'Elementary Statistics': 'statistics',
    'Intro to Statistics': 'statistics',
    
    // Science subjects
    'Physics': 'science',
    'Chemistry': 'science',
    'Biology': 'science',
    'Astronomy': 'science',
    'Earth Science': 'science',
    'Psychology': 'science',
    'Sociology': 'science',
    'Political Science': 'science',
    
    // Computer Science
    'Computer Science': 'computer-science',
    'Computer Science Fundamentals': 'computer-science',
    'Programming': 'code',
    'Data Structures': 'algorithm',
    'Algorithms': 'algorithm',
    'Web Development': 'web-dev',
    'Database Design': 'database',
    
    // Business
    'Business': 'business',
    'Business Administration': 'business',
    'Accounting': 'business',
    'Economics': 'business',
    'Finance': 'business',
    'History': 'business',
    'Philosophy': 'business',
    'English': 'business',
    'Writing': 'business',
    
    // Engineering
    'Engineering': 'engineering',
    'Mechanical Engineering': 'engineering',
    'Electrical Engineering': 'engineering',
    
    // Medical
    'Nursing': 'medical',
    'Pharmacology': 'medical',
    'Medical Sciences': 'medical',
    'Health Sciences': 'medical',
    'Anatomy': 'medical',
    'HESI': 'medical',
    'TEAS': 'medical',
    
    // Test Prep
    'GRE': 'test-prep',
    'LSAT': 'test-prep',
    'TOEFL': 'test-prep',
    'GED': 'test-prep',
  };

  // First try exact match
  if (subjectIconMap[subjectName]) {
    console.log(`✅ Icon mapping: "${subjectName}" -> "${subjectIconMap[subjectName]}"`);
    return subjectIconMap[subjectName];
  }

  // Pattern matching for partial matches
  const lowerName = subjectName.toLowerCase();
  
  // AWS variants
  if (lowerName.includes('aws') || lowerName.includes('amazon')) {
    return 'aws';
  }
  
  // CompTIA variants
  if (lowerName.includes('comptia')) {
    return 'comptia';
  }
  
  // Math variants
  if (lowerName.includes('math') || lowerName.includes('calculus') || lowerName.includes('algebra')) {
    return 'mathematics';
  }
  
  // Statistics variants
  if (lowerName.includes('stat') || lowerName.includes('data analysis')) {
    return 'statistics';
  }
  
  // Science variants
  if (lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) {
    return 'science';
  }
  
  // Computer Science variants
  if (lowerName.includes('computer') || lowerName.includes('programming') || lowerName.includes('software')) {
    return 'computer-science';
  }
  
  // Business variants
  if (lowerName.includes('business') || lowerName.includes('management') || lowerName.includes('finance')) {
    return 'business';
  }
  
  // Engineering variants
  if (lowerName.includes('engineering') || lowerName.includes('mechanical') || lowerName.includes('electrical')) {
    return 'engineering';
  }
  
  // Medical variants
  if (lowerName.includes('medical') || lowerName.includes('nursing') || lowerName.includes('health')) {
    return 'medical';
  }
  
  // Default fallback
  console.log(`⚠️ No icon mapping found for "${subjectName}", using fallback: academic`);
  return 'academic';
}

export default Icon;
