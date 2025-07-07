import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Alert className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Access Denied</h3>
                  <p className="text-sm">
                    You need administrator privileges to access this page. 
                    {!user ? " Please sign in with an admin account." : " Your current account does not have admin access."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/")}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Go Home
                  </Button>
                  {!user && (
                    <Button 
                      size="sm"
                      onClick={() => setLocation("/")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // User is admin, render the protected content
  return <>{children}</>;
}