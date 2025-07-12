"use client"; // Fixed: RSC directive for Vercel compatibility

import { useState } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  showRetry?: boolean;
  context?: string; // Fixed: Allow dynamic error context
  isFullscreen?: boolean; // Fixed: Option for non-fullscreen errors
}

// Fixed: Prop validation - ensure onRetry is provided when showRetry is true
function validateProps(props: ErrorMessageProps) {
  if (props.showRetry !== false && !props.onRetry) {
    console.warn('ErrorMessage: showRetry is true but onRetry is not provided');
  }
}

export function ErrorMessage({ 
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  showRetry = true,
  context,
  isFullscreen = true
}: ErrorMessageProps) {
  // Fixed: Add loading state for retry button
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Fixed: Prop validation in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ title, message, onRetry, showRetry, context, isFullscreen });
  }

  // Fixed: Enhanced retry handler with loading state
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Fixed: Dynamic message with context
  const displayMessage = context 
    ? `${message.replace('this content', context)}` 
    : message;

  // Fixed: Conditional wrapper for fullscreen vs inline display
  const containerClass = isFullscreen 
    ? "min-h-screen bg-gray-50 flex items-center justify-center px-4"
    : "flex items-center justify-center px-4 py-8";

  return (
    <div 
      className={containerClass}
      role="alert" // Fixed: Accessibility - screen reader alert
      aria-live="assertive" // Fixed: Accessibility - announce immediately
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-8">
          {displayMessage}
        </p>
        
        {/* Fixed: Enhanced retry button with loading state and accessibility */}
        {showRetry && onRetry && (
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            aria-label="Retry loading content"
            className="inline-flex items-center"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        )}
      </div>
    </div>
  );
}