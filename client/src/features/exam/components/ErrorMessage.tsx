import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorMessage({ 
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  showRetry = true
}: ErrorMessageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>
        
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            className="bg-primary text-white hover:bg-blue-700 px-6 py-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}