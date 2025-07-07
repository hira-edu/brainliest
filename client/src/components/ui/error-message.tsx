/**
 * Error Message Component
 * Displays error messages with optional retry action
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

interface ErrorMessageProps {
  message: string;
  action?: () => void;
  actionText?: string;
  className?: string;
}

export function ErrorMessage({ 
  message, 
  action, 
  actionText = 'Try Again',
  className 
}: ErrorMessageProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        {message}
      </p>
      
      {action && (
        <Button
          onClick={action}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
}