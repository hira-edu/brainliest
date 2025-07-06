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
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
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
      // Simulate Google sign-in
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock Google user data
      const mockGoogleUser = "GoogleUser" + Math.floor(Math.random() * 1000);
      signIn(mockGoogleUser);
      
      toast({
        title: "Success",
        description: "Successfully signed in with Google!",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Google sign-in failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setVerificationCode("");
    setShowVerification(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to ExamPractice Pro</DialogTitle>
          <DialogDescription>
            Sign in to access premium features and save your progress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {!showVerification ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
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
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
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

          <TabsContent value="social" className="space-y-4">
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

              <Button 
                variant="outline" 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center space-x-2"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#EA4335">
                  <path d="M22.2 12.1c0-0.7-0.1-1.4-0.2-2.1H12v4h5.8c-0.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z"/>
                  <path d="M12 22c2.8 0 5.2-0.9 6.9-2.5l-3.4-2.6c-0.9 0.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7C4.4 19.8 7.9 22 12 22z"/>
                  <path d="M6.2 13.6c-0.2-0.6-0.3-1.3-0.3-2s0.1-1.4 0.3-2V6.9H2.7C1.9 8.3 1.5 9.6 1.5 11s0.4 2.7 1.2 4.1l3.5-2.5z"/>
                  <path d="M12 4.8c1.5 0 2.9 0.5 4 1.5l3-3C17.2 1.7 14.8 0.5 12 0.5 7.9 0.5 4.4 2.7 2.7 6.9l3.5 2.7C7 6.6 9.3 4.8 12 4.8z"/>
                </svg>
                <span>{isLoading ? "Signing in..." : "Continue with Gmail"}</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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