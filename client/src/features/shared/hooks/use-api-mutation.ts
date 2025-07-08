/**
 * Reusable API mutation hook - Industrial-grade, war-tested logic
 */
import { useCallback } from 'react';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { useToast } from './use-toast';

export interface ApiMutationOptions<TData = any, TVariables = any> {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string | ((variables: TVariables) => string);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
  invalidateQueries?: Array<string | readonly string[]>;
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: unknown, variables: TVariables) => string);
  showToast?: boolean;
}

/**
 * Comprehensive API mutation hook that handles common patterns
 */
export function useApiMutation<TData = any, TVariables = any>(
  options: ApiMutationOptions<TData, TVariables>
): UseMutationResult<TData, unknown, TVariables> & { execute: (vars: TVariables) => void; executeAsync: (vars: TVariables) => Promise<TData> } {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, unknown, TVariables>({
    // Core API call logic
    mutationFn: async (variables: TVariables): Promise<TData> => {
      // Determine endpoint URL
      const endpoint = typeof options.url === 'function' ? options.url(variables) : options.url;

      // Execute the request
      const response = await apiRequest(options.method, endpoint, variables);

      // Ensure HTTP success, otherwise throw
      if (!response.ok) {
        // Attempt to parse error body if available
        let errorDetail: string;
        try {
          const errJson = await response.json();
          errorDetail = JSON.stringify(errJson);
        } catch {
          errorDetail = response.statusText;
        }
        throw new Error(`Request failed: ${response.status} ${errorDetail}`);
      }

      // Parse successful JSON
      return response.json();
    },

    // On success: invalidate cache, show toast, invoke custom handler
    onSuccess: (data, variables) => {
      if (options.invalidateQueries) {
        // Invalidate all provided query keys
        options.invalidateQueries.forEach((key) => {
          const queryKey = Array.isArray(key) ? key : [key];
          queryClient.invalidateQueries(queryKey);
        });
      }

      if (options.showToast ?? true) {
        const message = typeof options.successMessage === 'function'
          ? options.successMessage(data, variables)
          : options.successMessage || 'Operation successful';
        toast({ title: 'Success', description: message, variant: 'default' });
      }

      options.onSuccess?.(data, variables);
    },

    // On error: show toast and invoke custom handler
    onError: (error, variables) => {
      if (options.showToast ?? true) {
        const message = typeof options.errorMessage === 'function'
          ? options.errorMessage(error, variables)
          // Handle unknown error types
          : (error instanceof Error ? error.message : String(error)) || 'Operation failed';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }

      options.onError?.(error, variables);
    }
  });

  // Aliases for consistency and readability
  const execute = useCallback((vars: TVariables) => mutation.mutate(vars), [mutation]);
  const executeAsync = useCallback((vars: TVariables) => mutation.mutateAsync(vars), [mutation]);

  return { ...mutation, execute, executeAsync };
}

/**
 * Specialized mutation hooks for common CRUD operations
 */

export function useCreateMutation<TData = any, TVariables = any>(
  entityName: string,
  queryKeys: Array<string | readonly string[]>
) {
  return useApiMutation<TData, TVariables>({
    method: 'POST',
    url: `/api/${entityName.toLowerCase()}`,
    successMessage: `${entityName} created successfully`,
    invalidateQueries: queryKeys,
  });
}

export function useUpdateMutation<TData = any, TVariables extends { id: number }>(
  entityName: string,
  queryKeys: Array<string | readonly string[]>
) {
  return useApiMutation<TData, TVariables>({
    method: 'PUT',
    url: (vars) => `/api/${entityName.toLowerCase()}/${vars.id}`,
    successMessage: `${entityName} updated successfully`,
    invalidateQueries: [...queryKeys, `/api/${entityName.toLowerCase()}`],
  });
}

export function useDeleteMutation<TVariables extends { id: number }>(
  entityName: string,
  queryKeys: Array<string | readonly string[]>
) {
  return useApiMutation<void, TVariables>({
    method: 'DELETE',
    url: (vars) => `/api/${entityName.toLowerCase()}/${vars.id}`,
    successMessage: `${entityName} deleted successfully`,
    invalidateQueries: queryKeys,
  });
}

/**
 * Authentication-specific mutations
 */
export function useAuthMutation() {
  return {
    login: useApiMutation({ method: 'POST', url: '/api/auth/login', showToast: false }),
    register: useApiMutation({ method: 'POST', url: '/api/auth/register', showToast: false }),
    logout: useApiMutation({
      method: 'POST',
      url: '/api/auth/logout',
      invalidateQueries: [['user'], ['session']],
    }),
    verifyEmail: useApiMutation({ method: 'POST', url: '/api/auth/verify-email' }),
    resetPassword: useApiMutation({ method: 'POST', url: '/api/auth/reset-password' }),
  };
}
