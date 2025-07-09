// ProtectedAdminRoute.tsx
import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { useLocation } from 'wouter';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Shield, ArrowLeft, Lock } from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { adminUser, isLoading, login, error, trackActivity } = useAdmin();
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Clear errors when opening modal
  useEffect(() => {
    if (showLogin) trackActivity();
  }, [showLogin, trackActivity]);

  const handleLogin = async (email: string, password: string) => {
    setSubmitting(true);
    try {
      await login(email, password);
      setShowLogin(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Shield className="animate-pulse w-12 h-12 text-blue-600 mx-auto" />
        <p className="ml-2">Checking admin access...</p>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <>
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-screen">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Admin Authentication Required</CardTitle>
              <CardDescription>Please sign in with your administrator credentials.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm">This section requires admin access.</p>
              <Button onClick={() => setShowLogin(true)} className="w-full">
                <Lock className="mr-2" /> Admin Sign In
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLocation('/')} className="w-full">
                <ArrowLeft className="mr-1" /> Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
        {showLogin && <AdminLoginModal onLogin={handleLogin} isLoading={submitting} error={error} />}
      </>
    );
  }

  // Authenticated
  return <>{children}</>;
}
