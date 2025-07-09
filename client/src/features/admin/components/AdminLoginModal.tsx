// AdminLoginModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import RecaptchaProvider from '../../auth/recaptcha-provider';

interface AdminLoginModalProps {
  onLogin: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function AdminLoginModalContent({ onLogin, isLoading, error }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Clear local validation error when inputs change
  useEffect(() => {
    if (localError) {
      setLocalError(null);
    }
  }, [email, password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError('Email and password are required');
      return;
    }

    let recaptchaToken: string | undefined;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('admin_login');
      } catch (recapErr) {
        console.error('reCAPTCHA error:', recapErr);
        setLocalError('reCAPTCHA validation failed. Please try again.');
        return;
      }
    }

    // Attempt login; onLogin manages context error state
    await onLogin(trimmedEmail, password, recaptchaToken);
  }, [email, password, executeRecaptcha, onLogin]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl font-bold">Admin Access Required</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please sign in with your administrator credentials
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {(localError || error) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{localError || error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-email">
                <Mail className="inline w-4 h-4 mr-2" />
                Admin Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">
                <Lock className="inline w-4 h-4 mr-2" />
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="ml-2">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Security Notice:</strong> Admin access is restricted to authorized personnel only.
                    All login attempts are logged and monitored. This form is protected by reCAPTCHA.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim() || !password}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In as Admin
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Export the wrapped component
export function AdminLoginModal(props: AdminLoginModalProps) {
  return (
    <RecaptchaProvider>
      <AdminLoginModalContent {...props} />
    </RecaptchaProvider>
  );
}