import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
}

export function LoadingState({ 
  message = "Loading exam content...",
  showSpinner = true 
}: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {showSpinner && (
          <div className="mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        )}
        
        <p className="text-gray-600 text-lg">
          {message}
        </p>
        
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}