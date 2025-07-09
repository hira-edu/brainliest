/**
 * Icon Suspense Wrapper - Proper loading states and Suspense support
 * Fixes audit issue: Missing Suspense for slow initialization
 */

"use client";

import React, { Suspense, ReactNode } from 'react';
import { LoadingIcon } from './base-icon';
import { IconProps } from './types';

interface IconSuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  size?: IconProps['size'];
  'aria-label'?: string;
}

/**
 * Wrapper component that provides Suspense boundary for icon loading
 */
export function IconSuspenseWrapper({ 
  children, 
  fallback, 
  size = 'md',
  'aria-label': ariaLabel 
}: IconSuspenseWrapperProps) {
  const defaultFallback = (
    <LoadingIcon 
      size={size} 
      aria-label={ariaLabel || 'Loading icon'} 
    />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * HOC for wrapping icon components with Suspense
 */
export function withIconSuspense<P extends IconProps>(
  WrappedComponent: React.ComponentType<P>
) {
  const SuspenseWrappedIcon = React.forwardRef<SVGSVGElement, P>((props, ref) => (
    <IconSuspenseWrapper size={props.size} aria-label={props['aria-label']}>
      <WrappedComponent ref={ref} {...props} />
    </IconSuspenseWrapper>
  ));

  SuspenseWrappedIcon.displayName = `withIconSuspense(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return SuspenseWrappedIcon;
}

/**
 * Error boundary specifically for icon loading errors
 */
interface IconErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class IconErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  IconErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): IconErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Icon loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground"
          title={`Icon failed to load: ${this.state.error?.message || 'Unknown error'}`}
        >
          <span className="text-xs">?</span>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Complete icon wrapper with both Suspense and Error boundary
 */
export function SafeIconWrapper({ children, ...props }: IconSuspenseWrapperProps) {
  return (
    <IconErrorBoundary>
      <IconSuspenseWrapper {...props}>
        {children}
      </IconSuspenseWrapper>
    </IconErrorBoundary>
  );
}