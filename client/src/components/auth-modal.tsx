import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authTab, setAuthTab] = useState("email");
  const { signInWithGoogle, signIn } = useAuth();
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      const response = await fetch("/api/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      setIsEmailSent(true);
      toast({
        title: "Code Sent",
        description: "Check your email for the verification code",
      });
    } catch (error) {
      console.error("Send code error:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyCode = async () => {
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
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        // Extract username from email for signin
        const username = email.split('@')[0];
        signIn(username);
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in!",
        });
        
        onClose();
        resetForm();
      } else {
        toast({
          title: "Error",
          description: "Invalid or expired verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verify code error:", error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      
      onClose();
      resetForm();
      
      toast({
        title: "Welcome!",
        description: "Signed in successfully with Google!",
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
    setEmail("");
    setVerificationCode("");
    setIsEmailSent(false);
    setAuthTab("email");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to Brainliest</DialogTitle>
          <DialogDescription>
            Create an account or sign in to access unlimited practice questions and track your progress.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {!isEmailSent ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailLoading}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleSendCode}
                  disabled={!email || isEmailLoading}
                  className="w-full"
                >
                  {isEmailLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  We've sent a verification code to <strong>{email}</strong>
                </div>
                <div>
                  <Label htmlFor="code" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isVerificationLoading}
                    className="mt-1"
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode}
                  disabled={!verificationCode || isVerificationLoading}
                  className="w-full"
                >
                  {isVerificationLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setIsEmailSent(false)}
                  className="w-full text-sm"
                >
                  Back to email entry
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              variant="outline"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-600">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
}