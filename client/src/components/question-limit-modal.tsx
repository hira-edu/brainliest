import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuestionLimit } from "@/contexts/QuestionLimitContext";
import { Lock, CheckCircle } from "lucide-react";

interface QuestionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuestionLimitModal({ open, onOpenChange }: QuestionLimitModalProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  const { resetViewedQuestions } = useQuestionLimit();

  const handleSendCode = async () => {
    if (!email) return;
    
    setIsLoading(true);
    // Simulate sending verification code
    setTimeout(() => {
      setIsCodeSent(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyAndSignIn = async () => {
    if (!verificationCode) return;
    
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      signIn(email);
      resetViewedQuestions(); // Reset the question limit for signed-in user
      onOpenChange(false);
      setIsLoading(false);
      setEmail("");
      setVerificationCode("");
      setIsCodeSent(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      resetViewedQuestions();
      onOpenChange(false);
    } catch (error) {
      console.error('Google sign-in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            You've reached your free question limit!
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            You've viewed 20 free questions. Sign in to continue practicing with unlimited access to all questions and track your progress.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Free Forever Benefits:</span>
            </div>
            <ul className="mt-2 text-sm text-green-600 space-y-1">
              <li>• Unlimited question access</li>
              <li>• Progress tracking & analytics</li>
              <li>• AI-powered explanations</li>
              <li>• Bookmarks & study notes</li>
            </ul>
          </div>

          {!isCodeSent ? (
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
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleSendCode}
                disabled={!email || isLoading}
                className="w-full"
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
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
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleVerifyAndSignIn}
                disabled={!verificationCode || isLoading}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setIsCodeSent(false)}
                className="w-full text-sm"
              >
                Back to email entry
              </Button>
            </div>
          )}

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
              OR
            </span>
          </div>

          <Button 
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}