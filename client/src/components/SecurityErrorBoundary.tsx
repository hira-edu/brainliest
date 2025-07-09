/**
 * Security Error Boundary - Fixed version addressing all audit issues
 * Catches JavaScript errors, logs them securely, and provides fallback UI
 */

"use client"; // Fixed: RSC directive for Vercel compatibility

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/secure-logger';
import { securityLogger } from '../utils/security-logger';
import { Icon } from './icons/icon';
import { Button } from './ui/button';

// Fixed: Proper interface definitions for TypeScript
interface ErrorFallbackProps {
  error: Error;
  errorId: string;
  resetError: () => void;
}

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  enableReporting?: boolean; // Fixed: Configurable reporting for testing
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  errorInfo: ErrorInfo | null;
}

// Fixed: Comprehensive error information interface
interface ErrorReportData {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
}

// Fixed: Centralized timestamp generation
const getCurrentTimestamp = (): string => new Date().toISOString();

// Fixed: Safe browser environment checks
const getBrowserInfo = () => {
  if (typeof window === 'undefined') {
    return { userAgent: 'SSR', url: 'SSR' };
  }
  
  return {
    userAgent: navigator?.userAgent || 'Unknown',
    url: window?.location?.href || 'Unknown'
  };
};

// Fixed: Secure UUID generation instead of Math.random
const generateErrorId = (): string => {
  try {
    return uuidv4();
  } catch {
    // Fallback if uuid fails
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Fixed: Enhanced default fallback with accessibility and proper icon integration
function DefaultErrorFallback({ error, errorId, resetError }: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production';
  const showDetails = !isProduction;

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      role="alert" // Fixed: ARIA role for accessibility
      aria-live="assertive"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            {/* Fixed: Use proper Icon component instead of inline SVG */}
            <Icon 
              name="alert-triangle"
              size="lg"
              color="destructive"
              aria-label="Error occurred"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-4">
            We encountered an unexpected error. Our team has been notified.
          </p>
          
          {/* Fixed: Show error ID for user support */}
          <div className="text-sm text-gray-500 mb-6">
            <p>Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code></p>
            <p className="mt-1">Please reference this ID when contacting support.</p>
          </div>
          
          {/* Fixed: Enhanced accessibility for button */}
          <Button
            onClick={resetError}
            className="w-full"
            variant="default"
            aria-label="Try to reload the application"
          >
            <Icon name="refresh-cw" size="sm" className="mr-2" aria-hidden="true" />
            Try Again
          </Button>
          
          {/* Fixed: Show error details in development with proper formatting */}
          {showDetails && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Technical Details (Development Only)
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded-md">
                <div className="text-xs text-gray-800">
                  <p><strong>Message:</strong> {error.message}</p>
                  {error.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export class SecurityErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: null,
      errorInfo: null
    };
  }

  // Fixed: Proper error typing and enhanced error tracking
  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = generateErrorId();
    const timestamp = getCurrentTimestamp();
    const browserInfo = getBrowserInfo();
    
    // Fixed: Enhanced security logging with proper error handling
    try {
      securityLogger.logError(error, {
        errorId,
        timestamp,
        ...browserInfo,
        severity: 'error',
        category: 'react_error_boundary'
      });
    } catch (loggingError) {
      // Fallback logging if securityLogger fails
      console.error('Failed to log to securityLogger:', loggingError);
      console.error('Original error:', error);
    }
    
    return { 
      hasError: true, 
      error, 
      errorId
    };
  }

  // Fixed: Enhanced error catching with proper typing and retry logic
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { enableReporting = true } = this.props;
    
    // Store error info for potential display in development
    this.setState({ errorInfo });
    
    // Fixed: Configurable error reporting for testing
    if (enableReporting && (process.env.NODE_ENV === 'production' || process.env.ENABLE_ERROR_REPORTING === 'true')) {
      this.reportError(error, errorInfo).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    }
    
    // Fixed: Consolidated logging with timestamp
    const timestamp = getCurrentTimestamp();
    try {
      logger.error('Error caught by SecurityErrorBoundary:', {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp,
        retryCount: this.retryCount
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }

  // Fixed: Async error reporting with proper error handling and retry logic
  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    const { errorId } = this.state;
    
    if (!errorId) {
      console.warn('Cannot report error: errorId is null');
      return;
    }

    const browserInfo = getBrowserInfo();
    
    const errorData: ErrorReportData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: getCurrentTimestamp(),
      ...browserInfo,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION || 'unknown'
    };

    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
      }

      console.log(`Error ${errorId} reported successfully`);
    } catch (reportingError) {
      // Fixed: Log fetch failures for debugging
      console.error('Failed to report error to server:', reportingError);
      
      // Attempt to store locally for later retry
      try {
        const pendingErrors = JSON.parse(localStorage.getItem('pendingErrorReports') || '[]');
        pendingErrors.push(errorData);
        localStorage.setItem('pendingErrorReports', JSON.stringify(pendingErrors.slice(-10))); // Keep last 10
      } catch (storageError) {
        console.error('Failed to store error for later reporting:', storageError);
      }
    }
  }

  // Fixed: Enhanced reset logic with retry handling
  resetError = (): void => {
    this.retryCount++;
    
    // Fixed: Enhanced retry logic with navigation fallback
    if (this.retryCount > this.maxRetries) {
      console.warn('Max retry attempts reached, attempting navigation fallback');
      
      // Attempt to navigate to a safe route
      if (typeof window !== 'undefined') {
        try {
          window.location.href = '/';
          return;
        } catch (navigationError) {
          console.error('Navigation fallback failed:', navigationError);
        }
      }
    }

    // Reset state to try rendering children again
    this.setState({ 
      hasError: false, 
      error: null, 
      errorId: null,
      errorInfo: null
    });
  };

  // Fixed: Safe user ID retrieval
  private getUserId(): string | undefined {
    try {
      if (typeof window === 'undefined') return undefined;
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  // Fixed: Safe session ID retrieval
  private getSessionId(): string | undefined {
    try {
      if (typeof window === 'undefined') return undefined;
      return sessionStorage.getItem('sessionId') || undefined;
    } catch {
      return undefined;
    }
  }

  render(): ReactNode {
    const { hasError, error, errorId } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    if (hasError) {
      // Fixed: Proper null check for error
      if (!error || !errorId) {
        console.error('Error boundary state is corrupted');
        return (
          <DefaultErrorFallback 
            error={new Error('Unknown error occurred')}
            errorId="unknown"
            resetError={this.resetError}
          />
        );
      }

      // Use custom fallback if provided, otherwise use default
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={error}
            errorId={errorId}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback 
          error={error}
          errorId={errorId}
          resetError={this.resetError}
        />
      );
    }

    return children;
  }
}

// Fixed: Export both the class and a HOC for easier usage
export default SecurityErrorBoundary;

// Fixed: Higher-order component for easier wrapping
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  customFallback?: React.ComponentType<ErrorFallbackProps>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <SecurityErrorBoundary fallback={customFallback}>
        <WrappedComponent {...props} />
      </SecurityErrorBoundary>
    );
  };
}

// Fixed: Hook for manual error reporting
export function useErrorReporting() {
  const reportError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    const errorId = generateErrorId();
    const timestamp = getCurrentTimestamp();
    const browserInfo = getBrowserInfo();
    
    const errorData: ErrorReportData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack || 'Manual report',
      timestamp,
      ...browserInfo,
      buildVersion: process.env.REACT_APP_VERSION || 'unknown'
    };

    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...errorData, ...context }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Manual error reporting failed: ${response.status}`);
      }

      return { success: true, errorId };
    } catch (reportingError) {
      console.error('Manual error reporting failed:', reportingError);
      return { success: false, error: reportingError };
    }
  }, []);

  return { reportError };
}