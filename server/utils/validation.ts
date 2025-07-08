import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReducer, useRef, useEffect } from "react";
import { useAuth } from "./features/auth/AuthContext";
import { useQuestionLimit } from "./features/shared/QuestionLimitContext";
import { useToast } from "./features/shared/hooks/use-toast";
import { apiRequest } from "./services/queryClient";
import { Lock, CheckCircle } from "lucide-react";
import { validateEmail } from "@/utils/validation";

interface QuestionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type State = {
  email: string;
  code: string;
  isSent: boolean;
  tab: "email" | "google";
  loading: { send: boolean; verify: boolean; google: boolean };
};

type Action =
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_CODE"; code: string }
  | { type: "SET_TAB"; tab: "email" | "google" }
  | { type: "SENT" }
  | { type: "RESET" }
  | { type: "LOADING"; field: keyof State["loading"]; value: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.email.trim() };
    case "SET_CODE":
      return { ...state, code: action.code.trim() };
    case "SET_TAB":
      return { ...state, tab: action.tab };
    case "SENT":
      return { ...state, isSent: true };
    case "RESET":
      return {
        email: "",
        code: "",
        isSent: false,
        tab: "email",
        loading: { send: false, verify: false, google: false },
      };
    case "LOADING":
      return { ...state, loading: { ...state.loading, [action.field]: action.value } };
    default:
      return state;
  }
}

export default function QuestionLimitModal({ open, onOpenChange }: QuestionLimitModalProps) {
  const [state, dispatch] = useReducer(reducer, {
    email: "",
    code: "",
    isSent: false,
    tab: "email",
    loading: { send: false, verify: false, google: false },
  });
  const currentFetch = useRef<AbortController | null>(null);

  const { signInWithGoogle, verifyEmail } = useAuth();
  const { resetViewedQuestions } = useQuestionLimit();
  const { toast } = useToast();

  useEffect(() => {
    if (!open && currentFetch.current) {
      currentFetch.current.abort();
      currentFetch.current = null;
    }
  }, [open]);

  const handleSendCode = async () => {
    if (!state.email) {
      return toast({ title: "Error", description: "Email is required", variant: "destructive" });
    }
    if (!validateEmail(state.email)) {
      return toast({ title: "Error", description: "Invalid email format", variant: "destructive" });
    }

    dispatch({ type: "LOADING", field: "send", value: true });
    const controller = new AbortController();
    currentFetch.current = controller;

    try {
      const { data, error } = await apiRequest<{ sent: boolean }>("/api/send-code", {
        method: "POST",
        body: JSON.stringify({ email: state.email }),
        signal: controller.signal,
      });
      if (error || !data?.sent) {
        throw new Error(error?.message || "Server rejected send-code");
      }
      dispatch({ type: "SENT" });
      toast({ title: "Code Sent", description: "Check your inbox" });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      toast({ title: "Error", description: err.message || "Could not send code", variant: "destructive" });
    } finally {
      dispatch({ type: "LOADING", field: "send", value: false });
    }
  };

  const handleVerifyCode = async () => {
    if (!state.code) {
      return toast({ title: "Error", description: "Code is required", variant: "destructive" });
    }

    dispatch({ type: "LOADING", field: "verify", value: true });
    try {
      const { data, error } = await apiRequest<{ success: boolean; token?: string; message?: string }>(
        "/api/verify-code",
        {
          method: "POST",
          body: JSON.stringify({ email: state.email, code: state.code }),
        }
      );
      if (error || !data?.success) {
        throw new Error(data?.message || "Invalid or expired code");
      }
      if (data.token) {
        const result = await verifyEmail(data.token);
        if (!result.success) {
          throw new Error(result.message || "Verification flow failed");
        }
      }
      resetViewedQuestions();
      toast({ title: "Welcome!", description: "You're signed in" });
      onOpenChange(false);
      dispatch({ type: "RESET" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Verification failed", variant: "destructive" });
    } finally {
      dispatch({ type: "LOADING", field: "verify", value: false });
    }
  };

  const handleGoogleSignIn = async () => {
    dispatch({ type: "LOADING", field: "google", value: true });
    try {
      await signInWithGoogle();
      resetViewedQuestions();
      toast({ title: "Welcome!", description: "Signed in with Google" });
      onOpenChange(false);
      dispatch({ type: "RESET" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Google sign-in failed", variant: "destructive" });
    } finally {
      dispatch({ type: "LOADING", field: "google", value: false });
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
            You've viewed 20 free questions. Sign in to continue practicing.
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

          <Tabs value={state.tab} onValueChange={(tab) => dispatch({ type: "SET_TAB", tab })} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              {!state.isSent ? (
                <>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={state.email}
                      onChange={(e) => dispatch({ type: "SET_EMAIL", email: e.target.value })}
                      disabled={state.loading.send}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSendCode}
                    disabled={!state.email || state.loading.send}
                    className="w-full"
                  >
                    {state.loading.send ? "Sending..." : "Send Verification Code"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center text-sm text-gray-600">
                    We've sent a verification code to <strong>{state.email}</strong>
                  </div>
                  <div>
                    <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                    <Input
                      id="code"
                      placeholder="Enter 6-digit code"
                      value={state.code}
                      onChange={(e) => dispatch({ type: "SET_CODE", code: e.target.value })}
                      disabled={state.loading.verify}
                      className="mt-1"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleVerifyCode}
                    disabled={!state.code || state.loading.verify}
                    className="w-full"
                  >
                    {state.loading.verify ? "Verifying..." : "Verify & Continue"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => dispatch({ type: "SENT", value: false })}
                    className="w-full text-sm"
                  >
                    Back to email entry
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={state.loading.google}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                variant="outline"
              >
                {state.loading.google ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  /* SVG icon here */
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    {/* paths */}
                  </svg>
                )}
                {state.loading.google ? "Signing in..." : "Continue with Google"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
