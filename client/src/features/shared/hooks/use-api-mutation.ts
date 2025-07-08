/**
 * Reusable API mutation hook - DRY solution for repeated API call patterns
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { useToast } from './use-toast';

export interface ApiMutationOptions<TData = any, TVariables = any> {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string | ((variables: TVariables) => string);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: string[] | string[][];
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: Error, variables: TVariables) => string);
  showToast?: boolean;
}

/**
 * Comprehensive API mutation hook that handles common patterns
 */
export function useApiMutation<TData = any, TVariables = any>(
  options: ApiMutationOptions<TData, TVariables>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      setIsSubmitting(true);
      try {
        const url = typeof options.url === 'function' 
          ? options.url(variables) 
          : options.url;
        
        const response = await apiRequest(options.method, url, variables);
        const data = await response.json();
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ 
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] 
          });
        });
      }

      // Show success toast
      if (options.showToast !== false) {
        const message = typeof options.successMessage === 'function'
          ? options.successMessage(data, variables)
          : options.successMessage || 'Operation successful';
        
        toast({
          title: 'Success',
          description: message,
          variant: 'default'
        });
      }

      // Custom success handler
      options.onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      // Show error toast
      if (options.showToast !== false) {
        const message = typeof options.errorMessage === 'function'
          ? options.errorMessage(error, variables)
          : options.errorMessage || error.message || 'Operation failed';
        
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        });
      }

      // Custom error handler
      options.onError?.(error, variables);
    }
  });

  return {
    ...mutation,
    isSubmitting,
    execute: mutation.mutate,
    executeAsync: mutation.mutateAsync
  };
}

/**
 * Specialized mutation hooks for common operations
 */

// Create operation
export function useCreateMutation<TData = any, TVariables = any>(
  entityName: string,
  queryKey: string[]
) {
  return useApiMutation<TData, TVariables>({
    method: 'POST',
    url: `/api/${entityName.toLowerCase()}`,
    successMessage: `${entityName} created successfully`,
    invalidateQueries: [queryKey]
  });
}

// Update operation
export function useUpdateMutation<TData = any, TVariables = any & { id: number }>(
  entityName: string,
  queryKey: string[]
) {
  return useApiMutation<TData, TVariables>({
    method: 'PUT',
    url: (variables) => `/api/${entityName.toLowerCase()}/${variables.id}`,
    successMessage: `${entityName} updated successfully`,
    invalidateQueries: [queryKey, [`/api/${entityName.toLowerCase()}`]]
  });
}

// Delete operation
export function useDeleteMutation<TVariables = { id: number }>(
  entityName: string,
  queryKey: string[]
) {
  return useApiMutation<any, TVariables>({
    method: 'DELETE',
    url: (variables) => `/api/${entityName.toLowerCase()}/${variables.id}`,
    successMessage: `${entityName} deleted successfully`,
    invalidateQueries: [queryKey]
  });
}

/**
 * Authentication-specific mutations
 */
export function useAuthMutation() {
  return {
    login: useApiMutation({
      method: 'POST',
      url: '/api/auth/login',
      successMessage: 'Signed in successfully',
      showToast: false // Let auth context handle toasts
    }),
    
    register: useApiMutation({
      method: 'POST',
      url: '/api/auth/register',
      successMessage: 'Account created successfully',
      showToast: false
    }),
    
    logout: useApiMutation({
      method: 'POST',
      url: '/api/auth/logout',
      successMessage: 'Signed out successfully',
      invalidateQueries: [['user'], ['session']]
    }),
    
    verifyEmail: useApiMutation({
      method: 'POST',
      url: '/api/auth/verify-email',
      successMessage: 'Email verified successfully'
    }),
    
    resetPassword: useApiMutation({
      method: 'POST',
      url: '/api/auth/reset-password',
      successMessage: 'Password reset successfully'
    })
  };
}