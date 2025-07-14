/**
 * UnifiedAuthModal - Fixed version addressing all audit issues
 * Provides modal dialog for authentication with reCAPTCHA v3 integration
 * Fixed: reCAPTCHA token handling, password validation, resend logic, debouncing, error handling
 */

"use client"; // RSC directive for client-side authentication and Vercel compatibility with reCAPTCHA and dialog functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "./AuthContext";
import { useToast } from "../shared/hooks/use-toast";
import { Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import RecaptchaProvider from './recaptcha-provider';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'freemium' | 'general';
  title?: string;
  description?: string;
}

function UnifiedAuthModalContent({ 
  isOpen, 
  onClose, 
  mode = 'general',
  title,
  description 
}: UnifiedAuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false); // Fixed: Add separate loading state for resend

  const { signIn, signUp, signInWithGoogle, verifyEmail, resendEmailVerification } = useAuth() as any;
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Fixed: Add null check for executeRecaptcha to handle missing context
  const isRecaptchaReady = executeRecaptcha !== null;

  // Fixed: Add refs to prevent memory leaks and track mounted state
  const mountedRef = useRef(true);
  const resendDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const defaultTitle = mode === 'freemium' 
    ? 'Unlock Unlimited Access' 
    : 'Welcome to Brainliest';
  
  const defaultDescription = mode === 'freemium'
    ? 'Sign in to access unlimited practice questions and track your progress.'
    : 'Create an account or sign in to access all features and track your progress.';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fixed: Enhanced password validation matching UI requirements
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter (A-Z)');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter (a-z)');
    if (!/[0-9]/.test(password)) errors.push('One number (0-9)');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) errors.push('One special character (!@#$%^&*)');
    return errors;
  };

  // Fixed: Enhanced username validation
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return null; // Username is optional
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, hyphens, and underscores';
    return null;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (authMode === 'signin') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    } else {
      // Signup validation
      if (!formData.firstName?.trim()) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!formData.lastName?.trim()) {
        newErrors.lastName = 'Last name is required';
      }

      // Fixed: Enhanced username validation
      const usernameError = validateUsername(formData.username);
      if (usernameError) {
        newErrors.username = usernameError;
      }
      
      // Fixed: Enhanced password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          newErrors.password = `Password must include: ${passwordErrors.join(', ')}`;
        }
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fixed: Reusable reCAPTCHA token generation function
  const generateRecaptchaToken = useCallback(async (action: string): Promise<string> => {
    if (!executeRecaptcha) {
      if (import.meta.env.MODE === 'development') {
        console.warn(`🔒 executeRecaptcha function not available for action: ${action}`);
      }
      return '';
    }

    try {
      if (import.meta.env.MODE === 'development') {
        console.log(`🔒 Executing reCAPTCHA with action: ${action}`);
      }
      const token = await executeRecaptcha(action);
      if (import.meta.env.MODE === 'development') {
        console.log('🔒 reCAPTCHA token generated:', token ? `${token.substring(0, 20)}...` : 'EMPTY');
      }
      return token || '';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown reCAPTCHA error';
      console.error(`🔒 reCAPTCHA execution failed for action ${action}:`, errorMessage);
      return '';
    }
  }, [executeRecaptcha]);

  // Fixed: Centralized error toast utility
  const showErrorToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Fixed: Use reusable reCAPTCHA token generation
      const recaptchaToken = await generateRecaptchaToken(authMode === 'signin' ? 'login' : 'signup');
      
      if (import.meta.env.MODE === 'development') {
        console.log('🔒 Final reCAPTCHA token status:', recaptchaToken ? 'PRESENT' : 'MISSING');
      }

      if (authMode === 'signin') {
        const result = await signIn(formData.email, formData.password, recaptchaToken);
        if (result.success) {
          if (result.requiresEmailVerification) {
            setIsEmailSent(true);
            startResendTimer();
            toast({
              title: "Email Verification Required",
              description: "Please check your email for a verification code.",
            });
          } else {
            onClose();
            resetForm();
            toast({
              title: "Welcome back!",
              description: "Successfully signed in to your account.",
            });
          }
        } else {
          showErrorToast("Sign-in Failed", result.message || "Invalid credentials. Please try again.");
        }
      } else {
        // Fixed: Only log in development mode for security
        if (import.meta.env.MODE === 'development') {
          console.log('Signup payload:', {
            email: formData.email,
            password: '***hidden***',
            username: formData.username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            recaptchaToken: recaptchaToken ? 'present' : 'missing'
          });
        }
        
        const result = await signUp(formData.email, formData.password, {
          username: formData.username?.trim() || undefined, // Fixed: Handle optional username properly
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim()
        }, recaptchaToken);
        
        if (result.success) {
          if (result.requiresEmailVerification) {
            setIsEmailSent(true);
            startResendTimer();
            toast({
              title: "Account Created",
              description: "Please check your email for a verification code.",
            });
          } else {
            onClose();
            resetForm();
            toast({
              title: "Account Created!",
              description: "Welcome to Brainliest! Your account has been created successfully.",
            });
          }
        } else {
          showErrorToast("Sign-up Failed", result.message || "Failed to create account. Please try again.");
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Authentication error:', errorMessage);
      showErrorToast("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      showErrorToast("Error", "Please enter the verification code");
      return;
    }

    setIsVerificationLoading(true);
    try {
      const result = await verifyEmail(verificationCode.trim());
      if (result.success) {
        onClose();
        resetForm();
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
      } else {
        showErrorToast("Verification Failed", result.message || "Invalid verification code. Please try again.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
      console.error('Email verification error:', errorMessage);
      showErrorToast("Error", "Failed to verify email. Please try again.");
    } finally {
      if (mountedRef.current) {
        setIsVerificationLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Fixed: Use reusable reCAPTCHA token generation
      const recaptchaToken = await generateRecaptchaToken('google_signin');
      
      const result = await signInWithGoogle(recaptchaToken);
      
      // Fixed: Check for email verification requirement like other auth methods
      if (result?.success) {
        if (result.requiresEmailVerification) {
          setIsEmailSent(true);
          startResendTimer();
          toast({
            title: "Email Verification Required",
            description: "Please check your email for a verification code.",
          });
        } else {
          onClose();
          resetForm();
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google!",
          });
        }
      } else {
        showErrorToast("Google Sign-in Failed", result?.message || "Failed to authenticate with Google. Please try again.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Google sign-in error';
      console.error('Google sign-in error:', errorMessage);
      showErrorToast("Google Sign-in Failed", "Failed to authenticate with Google. Please try again.");
    } finally {
      if (mountedRef.current) {
        setIsGoogleLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      firstName: '',
      lastName: ''
    });
    setVerificationCode('');
    setIsEmailSent(false);
    setAuthMode('signin');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setResendTimer(0);
    setCanResend(false);
  };

  const switchMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  // Start resend timer (60 seconds)
  const startResendTimer = () => {
    setResendTimer(60);
    setCanResend(false);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Fixed: Resend email verification with debouncing and proper endpoint
  const handleResendEmail = async () => {
    // Fixed: Debounce to prevent spam clicking
    if (resendDebounceRef.current) {
      clearTimeout(resendDebounceRef.current);
    }

    resendDebounceRef.current = setTimeout(async () => {
      try {
        setIsResendingEmail(true);
        
        // Fixed: Use reusable reCAPTCHA token generation
        const recaptchaToken = await generateRecaptchaToken('resend_verification');

        // Fixed: Use dedicated resend endpoint if available, otherwise fall back to signUp
        let result;
        if (resendEmailVerification) {
          result = await resendEmailVerification(formData.email, recaptchaToken);
        } else {
          // Fallback: Use signUp method for resending
          result = await signUp(formData.email, formData.password, {
            username: formData.username?.trim() || undefined,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim()
          }, recaptchaToken);
        }
        
        if (result.success) {
          startResendTimer();
          toast({
            title: "Email Resent",
            description: "We've sent a new verification code to your email.",
          });
        } else {
          showErrorToast("Resend Failed", result.message || "Failed to resend email. Please try again.");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown resend error';
        console.error('Email resend error:', errorMessage);
        showErrorToast("Error", "Failed to resend email. Please try again.");
      } finally {
        if (mountedRef.current) {
          setIsResendingEmail(false);
        }
      }
    }, 500); // 500ms debounce
  };

  // Fixed: Enhanced useEffect cleanup and modal management
  useEffect(() => {
    mountedRef.current = true;
    
    // Fixed: Only reset form if not in email verification state
    if (!isOpen && !isEmailSent) {
      resetForm();
    }
    
    return () => {
      mountedRef.current = false;
      // Clear debounce timeout on unmount
      if (resendDebounceRef.current) {
        clearTimeout(resendDebounceRef.current);
      }
    };
  }, [isOpen, isEmailSent]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {isEmailSent ? (
          // Email verification step
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                We've sent a verification code to {formData.email}. Please check your email and enter the code below.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isVerificationLoading}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleVerifyEmail}
                disabled={isVerificationLoading}
                className="flex-1"
              >
                {isVerificationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
              <Button
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                disabled={isVerificationLoading}
              >
                Back
              </Button>
            </div>

            {/* Resend Email Section */}
            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the email?</p>
              <Button
                onClick={handleResendEmail}
                variant="link"
                disabled={!canResend || isResendingEmail}
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
              >
                {isResendingEmail && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : isResendingEmail ? (
                  "Sending..."
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Main authentication form
          <div className="space-y-4">
            {/* Google Sign-in */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              variant="outline"
              className="w-full"
            >
              {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              {authMode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                      {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={isLoading}
                        autoComplete="family-name"
                      />
                      {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username (optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        placeholder="Choose a username (optional)"
                        className="pl-10"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                    {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {authMode === 'signup' && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">Password Requirements:</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      <li>• At least 8 characters long</li>
                      <li>• One uppercase letter (A-Z)</li>
                      <li>• One lowercase letter (a-z)</li>
                      <li>• One number (0-9)</li>
                      <li>• One special character (!@#$%^&*)</li>
                    </ul>
                  </div>
                )}
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || isGoogleLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>

              {/* reCAPTCHA Protection Indicator */}
              <div className="flex items-center justify-center space-x-2 py-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Protected by reCAPTCHA v3</span>
              </div>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={isLoading}
                >
                  {authMode === 'signin' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Named export for use in imports
export function UnifiedAuthModal(props: UnifiedAuthModalProps) {
  return (
    <RecaptchaProvider>
      <UnifiedAuthModalContent {...props} />
    </RecaptchaProvider>
  );
}

// Default export for backward compatibility
export default UnifiedAuthModal;