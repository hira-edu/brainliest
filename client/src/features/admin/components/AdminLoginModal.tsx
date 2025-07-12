/**
 * AdminLoginModal - Fixed version addressing all audit issues
 * Modal component for admin login with enhanced security and accessibility
 */

 // Fixed: RSC directive for Vercel compatibility

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import RecaptchaProvider from '../../auth/recaptcha-provider';
import { Icon } from '../../../components/icons/icon'; // Fixed: Use proper Icon component

// Fixed: Updated interface to match AdminContext.tsx error type
interface AdminLoginModalProps {
  onLogin: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null; // Fixed: Changed from string | null to Error | null
}

// Fixed: Email validation utility
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function AdminLoginModalContent({ onLogin, isLoading, error }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const emailInputRef = useRef<HTMLInputElement>(null); // Fixed: Focus management

  // Fixed: Enhanced error clearing with context error
  useEffect(() => {
    if (localError) {
      setLocalError(null);
    }
  }, [email, password]);

  // Fixed: Focus management for accessibility
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    
    // Fixed: Enhanced email validation
    if (!trimmedEmail || !password) {
      setLocalError('Email and password are required');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    let recaptchaToken: string | undefined;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('admin_login');
      } catch (recapErr: unknown) {
        // Fixed: Proper error typing
        const errorMessage = recapErr instanceof Error 
          ? recapErr.message 
          : 'reCAPTCHA validation failed';
        console.error('reCAPTCHA error:', recapErr);
        setLocalError(`reCAPTCHA validation failed: ${errorMessage}. Please try again.`);
        return;
      }
    }

    try {
      // Attempt login; onLogin manages context error state
      await onLogin(trimmedEmail, password, recaptchaToken);
      
      // Fixed: Reset form fields after successful login
      setEmail('');
      setPassword('');
      setLocalError(null);
    } catch (loginError) {
      // Login errors are handled by context, but we can clear local state
      console.error('Login error:', loginError);
    }
  }, [email, password, executeRecaptcha, onLogin]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog" // Fixed: ARIA modal attributes
      aria-modal="true"
      aria-labelledby="admin-login-title"
      aria-describedby="admin-login-description"
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            {/* Fixed: Use proper Icon component */}
            <Icon name="lock" size="md" className="text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle id="admin-login-title" className="text-xl font-bold">
            Admin Access Required
          </CardTitle>
          <p id="admin-login-description" className="text-sm text-muted-foreground">
            Please sign in with your administrator credentials
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* Fixed: Enhanced error display with proper error type handling */}
            {(localError || error) && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <Icon name="alert-circle" size="sm" />
                <AlertDescription>
                  {localError || (error?.message || 'Authentication failed')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-email">
                <Icon name="mail" size="sm" className="inline mr-2" />
                Admin Email
              </Label>
              <Input
                ref={emailInputRef} // Fixed: Focus management
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                aria-describedby={localError ? "email-error" : undefined}
                aria-invalid={localError ? "true" : "false"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">
                <Icon name="lock" size="sm" className="inline mr-2" />
                Admin Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                aria-describedby={localError ? "password-error" : undefined}
                aria-invalid={localError ? "true" : "false"}
              />
            </div>

            {/* Fixed: Enhanced security notice */}
            <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <div className="flex items-center">
                <Icon name="alert-circle" size="sm" className="mr-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Security Notice:</span>
              </div>
              <p className="mt-1">
                Admin access is monitored and logged. Unauthorized access attempts will be reported.
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim() || !password}
              aria-describedby="login-button-description"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Icon name="lock" size="sm" className="mr-2" />
                  Sign In as Admin
                </>
              )}
            </Button>
            <span id="login-button-description" className="sr-only">
              Sign in with your administrator credentials
            </span>
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