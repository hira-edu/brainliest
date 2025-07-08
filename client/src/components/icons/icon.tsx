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
    // Always call hook
    const iconName = useSubjectIconName(subjectName);
    return (
      <Icon
        ref={ref}
        name={iconName || fallback}
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
function useSubjectIconName(subjectName: string): string {
  const subjectIconMap: Record<string, string> = {
    'PMP Certification': 'pmp',
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
    'Azure Administrator': 'azure',
    'Google Cloud Professional': 'google-cloud',
    'Oracle Database': 'oracle',
    'VMware vSphere': 'vmware',
    'Kubernetes Administrator': 'kubernetes',
    'Docker Certified Associate': 'docker',
    Mathematics: 'mathematics',
    Calculus: 'mathematics',
    'Linear Algebra': 'mathematics',
    'Discrete Mathematics': 'mathematics',
    Geometry: 'mathematics',
    'Pre-Calculus': 'mathematics',
    Statistics: 'statistics',
    'AP Statistics': 'statistics',
    Biostatistics: 'statistics',
    'Business Statistics': 'statistics',
    'Elementary Statistics': 'statistics',
    'Intro to Statistics': 'statistics',
    Physics: 'science',
    Chemistry: 'science',
    Biology: 'science',
    Astronomy: 'science',
    'Earth Science': 'science',
    'Computer Science': 'computer-science',
    Programming: 'code',
    'Data Structures': 'algorithm',
    Algorithms: 'algorithm',
    'Web Development': 'web-dev',
    'Database Design': 'database',
    'Computer Science Fundamentals': 'computer-science',
    Business: 'business',
    Accounting: 'business',
    Economics: 'business',
    Finance: 'business',
    'Business Administration': 'business',
    Engineering: 'engineering',
    'Mechanical Engineering': 'engineering',
    'Electrical Engineering': 'engineering',
    Nursing: 'medical',
    Pharmacology: 'medical',
    'Medical Sciences': 'medical',
    'Health Sciences': 'medical',
    Anatomy: 'medical',
    HESI: 'medical',
    TEAS: 'medical',
    Psychology: 'science',
    History: 'business',
    Philosophy: 'business',
    Sociology: 'science',
    'Political Science': 'science',
    English: 'business',
    Writing: 'business',
    GRE: 'test-prep',
    LSAT: 'test-prep',
    TOEFL: 'test-prep',
    GED: 'test-prep',
  };
  return subjectIconMap[subjectName] || 'academic';
}

export default Icon;
