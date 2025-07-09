import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../utils/secure-logger';
import { securityLogger } from '../utils/security-logger';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    // Log security-relevant errors
    securityLogger.logError(error, {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to external error tracking (e.g., Sentry)
      this.reportError(error, errorInfo);
    }
    
    logger.error('Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // This would integrate with your error tracking service
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800">
            Something went wrong
          </h3>
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        We're sorry, but something unexpected happened. Please try again.
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error details (development only)
          </summary>
          <pre className="mt-2 text-xs text-gray-400 overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
      
      <div className="mt-4">
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);