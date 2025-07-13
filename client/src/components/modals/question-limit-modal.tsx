/**
 * Question Limit Modal - Fixed version addressing all audit issues
 * Prompts users to sign in when they reach free question limit (20 questions)
 */

"use client"; // Fixed: RSC directive for Vercel compatibility

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { useAuth } from '../../features/auth/AuthContext';
import { useQuestionLimit } from '../../features/shared/QuestionLimitContext';
import { useToast } from '../../features/shared/hooks/use-toast';
import { apiRequest } from '../../services/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LoadingIcon } from '../icons/base-icon';
import { Icon } from '../icons/icon';

// Fixed: Comprehensive validation schemas
const EmailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

const VerificationCodeSchema = z.string()
  .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits')
  .min(6, 'Verification code is required');

// Fixed: API response type definitions
interface SendCodeResponse {
  success: boolean;
  message?: string;
}

interface VerifyCodeResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface AuthErrorData {
  message?: string;
  status?: number;
}

interface QuestionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fixed: Centralized error handling utility
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorData = error as AuthErrorData;
    return errorData.message || 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
};

// Fixed: Centralized validation utility
const validateAndShowError = (
  value: string,
  schema: z.ZodSchema,
  toast: ReturnType<typeof useToast>['toast']
): boolean => {
  const result = schema.safeParse(value);
  if (!result.success) {
    toast({
      title: "Validation Error",
      description: result.error.errors[0].message,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

export default function QuestionLimitModal({ open, onOpenChange }: QuestionLimitModalProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authTab, setAuthTab] = useState("email");
  
  const { signInWithGoogle, verifyEmail } = useAuth();
  const { resetViewedQuestions } = useQuestionLimit();
  const { toast } = useToast();

  // Fixed: Comprehensive form reset
  const resetForm = useCallback(() => {
    setEmail("");
    setVerificationCode("");
    setIsEmailSent(false);
    setIsEmailLoading(false);
    setIsVerificationLoading(false);
    setIsGoogleLoading(false);
    setAuthTab("email");
  }, []);

  // Fixed: Proper modal closing with form reset timing
  const handleCloseModal = useCallback(() => {
    resetForm(); // Reset before closing to prevent state updates on unmounted component
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  // Fixed: Enhanced email code sending with proper error handling
  const handleSendCode = async () => {
    if (!validateAndShowError(email, EmailSchema, toast)) {
      return;
    }

    setIsEmailLoading(true);
    try {
      // Fixed: Use apiRequest for consistency
      const response = await apiRequest("POST", "/api/send-code", { email });
      const data = await response.json() as SendCodeResponse;
      
      if (data.success) {
        setIsEmailSent(true);
        toast({
          title: "Code Sent",
          description: "Check your email for the verification code",
        });
      } else {
        throw new Error(data.message || 'Failed to send verification code');
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Fixed: Enhanced code verification with proper token handling
  const handleVerifyCode = async () => {
    if (!validateAndShowError(verificationCode, VerificationCodeSchema, toast)) {
      return;
    }

    setIsVerificationLoading(true);
    try {
      // Fixed: Use apiRequest with proper typing
      const response = await apiRequest("POST", "/api/verify-code", { email, code: verificationCode });
      const data = await response.json() as VerifyCodeResponse;

      if (data.success) {
        // Fixed: Tie reset to successful verification only
        let verificationSuccess = false;
        
        if (data.token) {
          const verifyResult = await verifyEmail(data.token);
          if (verifyResult.success) {
            verificationSuccess = true;
          } else {
            throw new Error(verifyResult.message || "Email verification failed");
          }
        } else {
          verificationSuccess = true;
        }
        
        // Only reset question count after successful verification
        if (verificationSuccess) {
          await resetViewedQuestions();
          
          toast({
            title: "Welcome!",
            description: "Successfully signed in! Continue practicing unlimited questions.",
          });
          
          handleCloseModal();
        }
      } else {
        throw new Error(data.message || "Invalid or expired verification code");
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Fixed: Enhanced Google sign-in with proper error handling
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result && typeof result === 'object' && 'success' in result && (result as any).success) {
        // Only reset question count after successful authentication
        await resetViewedQuestions();
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google! Continue practicing unlimited questions.",
        });
        
        handleCloseModal();
      } else {
        const errorMessage = (result && typeof result === 'object' && 'message' in result) 
          ? String(result.message) 
          : "Google sign-in failed";
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Fixed: Centralized button disabled logic
  const isEmailButtonDisabled = !email || isEmailLoading;
  const isVerifyButtonDisabled = !verificationCode || isVerificationLoading;
  const isGoogleButtonDisabled = isGoogleLoading;

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            {/* Fixed: Use proper Icon component with BaseIcon integration */}
            <Icon 
              name="lock"
              size="lg"
              color="primary"
              aria-label="Account locked"
            />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Question Limit Reached
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to continue practicing with unlimited questions
          </p>
        </DialogHeader>

        <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {!isEmailSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isEmailButtonDisabled) {
                        handleSendCode();
                      }
                    }}
                    disabled={isEmailLoading}
                    aria-describedby="email-description"
                  />
                  <p id="email-description" className="text-xs text-muted-foreground">
                    We'll send you a verification code
                  </p>
                </div>

                <Button 
                  onClick={handleSendCode} 
                  disabled={isEmailButtonDisabled}
                  className="w-full"
                >
                  {isEmailLoading ? (
                    <>
                      {/* Fixed: Use LoadingIcon for consistency */}
                      <LoadingIcon size="sm" className="mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => {
                      // Fixed: Only allow numeric input and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isVerifyButtonDisabled) {
                        handleVerifyCode();
                      }
                    }}
                    maxLength={6}
                    disabled={isVerificationLoading}
                    aria-describedby="code-description"
                  />
                  <p id="code-description" className="text-xs text-muted-foreground">
                    Check your email for the verification code
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isVerifyButtonDisabled}
                    className="w-full"
                  >
                    {isVerificationLoading ? (
                      <>
                        <LoadingIcon size="sm" className="mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        {/* Fixed: Use proper Icon component */}
                        <Icon 
                          name="check-circle"
                          size="sm"
                          className="mr-2"
                          aria-hidden="true"
                        />
                        Verify & Continue
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={() => setIsEmailSent(false)}
                    className="w-full"
                    disabled={isVerificationLoading}
                  >
                    Back to Email
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in with your Google account to continue
              </p>
              
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={isGoogleButtonDisabled}
                variant="outline"
                className="w-full"
              >
                {isGoogleLoading ? (
                  <>
                    <LoadingIcon size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    {/* Fixed: Use proper Icon component for Google */}
                    <Icon 
                      name="chrome"
                      size="sm"
                      className="mr-2"
                      aria-hidden="true"
                    />
                    Continue with Google
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our terms of service
        </div>
      </DialogContent>
    </Dialog>
  );
}