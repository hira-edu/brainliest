import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../AuthContext";
import { useToast } from "../../shared/hooks/use-toast";
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

  const { signIn, signUp, signInWithGoogle, verifyEmail } = useAuth();
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Generate reCAPTCHA token
      let recaptchaToken = '';
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha(authMode === 'signin' ? 'login' : 'signup');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
          // Continue without reCAPTCHA if it fails
        }
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
          toast({
            title: "Sign-in Failed",
            description: result.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Debug: Log the signup payload
        console.log('Signup payload:', {
          email: formData.email,
          password: '***hidden***',
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          recaptchaToken: recaptchaToken ? 'present' : 'missing'
        });
        
        const result = await signUp(formData.email, formData.password, {
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName
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
          toast({
            title: "Sign-up Failed",
            description: result.message || "Failed to create account. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerificationLoading(true);
    try {
      const result = await verifyEmail(verificationCode);
      if (result.success) {
        onClose();
        resetForm();
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Generate reCAPTCHA token for Google sign-in
      let recaptchaToken = '';
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('google_signin');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
          // Continue without reCAPTCHA if it fails
        }
      }
      
      await signInWithGoogle(recaptchaToken);
      
      onClose();
      resetForm();
      
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google!",
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google Sign-in Failed",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
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

  // Resend email verification
  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      
      // Generate reCAPTCHA token for resend
      let recaptchaToken = '';
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('resend_verification');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      }

      const result = await signUp(formData.email, formData.password, {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName
      }, recaptchaToken);
      
      if (result.success) {
        startResendTimer();
        toast({
          title: "Email Resent",
          description: "We've sent a new verification code to your email.",
        });
      } else {
        toast({
          title: "Resend Failed",
          description: result.message || "Failed to resend email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

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
                disabled={!canResend || isLoading}
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
              >
                {resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
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
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        placeholder="Choose a username"
                        className="pl-10"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
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

export default function UnifiedAuthModal(props: UnifiedAuthModalProps) {
  return (
    <RecaptchaProvider>
      <UnifiedAuthModalContent {...props} />
    </RecaptchaProvider>
  );
}