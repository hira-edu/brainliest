/**
 * Reusable form state management hook - DRY solution for repeated useState patterns
 */
import { useState, useCallback } from 'react';

export interface FormState<T = Record<string, any>> {
  data: T;
  errors: Record<string, string>;
  isLoading: boolean;
  isSubmitting: boolean;
}

export interface FormActions<T = Record<string, any>> {
  setData: (data: Partial<T> | ((prev: T) => T)) => void;
  setErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  updateField: (field: keyof T, value: any) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  reset: () => void;
}

/**
 * Comprehensive form state management hook to reduce useState duplication
 */
export function useFormState<T extends Record<string, any>>(
  initialData: T
): [FormState<T>, FormActions<T>] {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsLoading(false);
    setIsSubmitting(false);
  }, [initialData]);

  const formState: FormState<T> = {
    data,
    errors,
    isLoading,
    isSubmitting
  };

  const formActions: FormActions<T> = {
    setData,
    setErrors,
    setIsLoading,
    setIsSubmitting,
    updateField,
    setError,
    clearError,
    clearAllErrors,
    reset
  };

  return [formState, formActions];
}

/**
 * Specialized hook for authentication forms
 */
export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  verificationCode?: string;
}

export function useAuthForm(initialData?: Partial<AuthFormData>) {
  const defaultData: AuthFormData = {
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    verificationCode: '',
    ...initialData
  };

  return useFormState(defaultData);
}

/**
 * Hook for loading states with automatic timeout
 */
export function useLoadingState(timeoutMs = 30000) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    
    // Automatic timeout to prevent infinite loading
    const id = setTimeout(() => {
      setIsLoading(false);
      console.warn('Loading state timed out after', timeoutMs, 'ms');
    }, timeoutMs);
    
    setTimeoutId(id);
  }, [timeoutMs]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return {
    isLoading,
    startLoading,
    stopLoading
  };
}