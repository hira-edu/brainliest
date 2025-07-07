import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Lock, User } from "lucide-react";
import { UnifiedAuthModal } from "../../auth/components/unified-auth-modal";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasChecked(true);
    }
  }, [isLoading]);

  // Show loading while auth is checking
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user && user.role === "admin";

  // Show organizational authentication requirement when user is not signed in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Organizational Authentication Required</CardTitle>
            <CardDescription>
              Please authenticate with your organizational credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This area requires administrator-level authentication. Please sign in with your authorized organizational account.
            </p>
            <Button 
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <User className="w-4 h-4" />
              Authenticate to Continue
            </Button>
            <UnifiedAuthModal 
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              mode="general"
              title="Admin Authentication"
              description="Please authenticate with your organizational credentials to access the admin panel"
            />
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go Home
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact your system administrator if you need access credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied when user is signed in but doesn't have admin role
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              Insufficient administrator privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account ({user.email}) does not have administrator privileges required for this area.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Current Role: <span className="font-medium">{user.role || 'user'}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Required Role: <span className="font-medium">admin</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go Home
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact your system administrator to request admin access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is admin, render the protected content
  return <>{children}</>;
}