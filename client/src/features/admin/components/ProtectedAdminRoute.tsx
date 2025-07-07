import { useAdmin } from "../AdminContext";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Lock } from "lucide-react";
import { AdminLoginModal } from "./AdminLoginModal";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { adminUser, isLoading, login, error } = useAdmin();
  const [, setLocation] = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginLoading(true);
      await login(email, password);
      setIsLoginModalOpen(false);
    } catch (error) {
      // Error is handled by AdminContext
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading while auth is checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show admin authentication requirement when admin user is not signed in
  if (!adminUser) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Admin Authentication Required</CardTitle>
              <CardDescription>
                Please authenticate with your administrator credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This area requires administrator-level authentication. Please sign in with your authorized admin account.
              </p>
              <Button 
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => setIsLoginModalOpen(true)}
              >
                <Lock className="w-4 h-4" />
                Admin Sign In
              </Button>
              <div className="flex gap-2 mt-4">
                <Link href="/" className="flex-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Go Home
                  </Button>
                </Link>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Security Notice:</strong> Admin access is restricted to authorized personnel only. 
                  All login attempts are logged and monitored.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {isLoginModalOpen && (
          <AdminLoginModal
            onLogin={handleLogin}
            isLoading={loginLoading}
            error={error}
          />
        )}
      </>
    );
  }

  // Admin user is authenticated, render the protected content
  return <>{children}</>;
}