import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sign-in
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract name from email
      const name = email.split('@')[0];
      signIn(name);
      
      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowVerification(true);
      toast({
        title: "Code Sent",
        description: "Check your email for the verification code",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      // Simulate code verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract name from email
      const name = email.split('@')[0];
      signIn(name);
      
      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      
      toast({
        title: "Success",
        description: "Successfully signed in with Google!",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setVerificationCode("");
    setShowVerification(false);
    setAuthMode("signin");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Brainliest</DialogTitle>
          <DialogDescription>
            {authMode === "signin" ? "Sign in to your account" : "Create a new account to get started"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email Address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleSignIn} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => setAuthMode("signup")}
                >
                  Sign up here
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {!showVerification ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleSendCode} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending Code..." : "Send Verification Code"}
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-600">Already have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => setAuthMode("signin")}
                  >
                    Sign in here
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    disabled={isLoading}
                    className="text-center text-lg tracking-widest"
                  />
                  <p className="text-sm text-gray-600">
                    Code sent to {email}
                  </p>
                  <p className="text-xs text-gray-500">
                    For demo: enter any 6-digit code
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleVerifyCode} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify & Create Account"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVerification(false)}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Back to Email
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-600">
          <p className="mb-3">Or continue with</p>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center space-x-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-4">
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}