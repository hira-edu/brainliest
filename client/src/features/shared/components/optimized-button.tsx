 // RSC directive for interactive button functionality

/**
 * Optimized button component - DRY solution for repeated button patterns
 */
import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";
import { ButtonProps } from "../../../components/ui/button";

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
}

/**
 * Button with built-in loading state management
 */
export function LoadingButton({
  isLoading = false,
  loadingText,
  icon,
  loadingIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          {loadingIcon}
          {loadingText || children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}

/**
 * Submit button specifically for forms
 */
export interface SubmitButtonProps extends LoadingButtonProps {
  form?: string;
  isSubmitting?: boolean;
  submitText?: string;
}

export function SubmitButton({
  isSubmitting = false,
  submitText = "Submit",
  loadingText = "Submitting...",
  type = "submit",
  className = "w-full",
  ...props
}: SubmitButtonProps) {
  return (
    <LoadingButton
      type={type}
      isLoading={isSubmitting}
      loadingText={loadingText}
      className={className}
      {...props}
    >
      {submitText}
    </LoadingButton>
  );
}

/**
 * Authentication-specific buttons
 */
export function SignInButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Signing in..."
      className="w-full"
      {...props}
    >
      Sign In
    </LoadingButton>
  );
}

export function SignUpButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Creating account..."
      className="w-full"
      {...props}
    >
      Create Account
    </LoadingButton>
  );
}

export function GoogleSignInButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      variant="outline"
      isLoading={isLoading}
      loadingText="Connecting..."
      className="w-full"
      icon={!isLoading ? (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      ) : undefined}
      {...props}
    >
      Continue with Google
    </LoadingButton>
  );
}

/**
 * Admin action buttons
 */
export function DeleteButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      variant="destructive"
      size="sm"
      isLoading={isLoading}
      loadingText="Deleting..."
      {...props}
    >
      Delete
    </LoadingButton>
  );
}

export function SaveButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Saving..."
      {...props}
    >
      Save
    </LoadingButton>
  );
}

export function CreateButton({ isLoading, ...props }: LoadingButtonProps) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Creating..."
      {...props}
    >
      Create
    </LoadingButton>
  );
}