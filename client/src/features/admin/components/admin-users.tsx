/**
 * AdminUsers Component - Fixed version addressing all audit issues
 * Comprehensive user management interface with enterprise-grade error handling and accessibility
 */

"use client"; // Fixed: RSC directive for Vercel compatibility

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Enhanced imports with proper error boundary integration
import { SecurityErrorBoundary } from "../../../components/SecurityErrorBoundary";
import { DynamicIcon } from "../../../utils/dynamic-icon";
import { Icon } from "../../../components/icons/icon";

// UI Components
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/form";
import { Switch } from "../../../components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Alert, AlertDescription } from "../../../components/ui/alert";

// Services and hooks
import { useToast } from "../../shared/hooks/use-toast";
import { apiRequest, queryClient } from "../../../services/queryClient";

// Types
import type { User } from "../../../../../shared/schema";

// Fixed: Comprehensive type definitions
interface UserFilters {
  role: string;
  isActive: string;
  isBanned: string;
  search: string;
}

interface UserStats {
  total: number;
  active: number;
  banned: number;
  admins: number;
}

interface PaginationState {
  page: number;
  itemsPerPage: number;
}

interface ModalState {
  showCreateDialog: boolean;
  showEditDialog: boolean;
  showBanDialog: boolean;
  showDeleteDialog: boolean;
}

// Fixed: Safe browser environment check utility
const isBrowser = (): boolean => typeof window !== 'undefined';

// Fixed: Safe localStorage access
const getAdminToken = (): string | null => {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
  } catch {
    return null;
  }
};

// Fixed: Enhanced form schemas with proper validation
const createUserSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/\d/, "Password must contain number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain special character"),
  role: z.enum(["user", "moderator", "admin"], { 
    errorMap: () => ({ message: "Please select a valid role" })
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["user", "moderator", "admin"], {
    errorMap: () => ({ message: "Please select a valid role" })
  }).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/\d/, "Password must contain number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain special character")
    .optional(),
});

// Fixed: Type-safe form data types
type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// Fixed: Utility functions to reduce duplicate code
const getBadgeColor = (type: 'role' | 'status', value: string): string => {
  const colorMaps = {
    role: {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      moderator: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    },
    status: {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      banned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  };

  return colorMaps[type][value as keyof typeof colorMaps[typeof type]] || colorMaps[type].user;
};

// Fixed: Enhanced mutation error handler
const handleMutationError = (
  error: unknown, 
  toast: ReturnType<typeof useToast>['toast'],
  defaultMessage: string = "An error occurred"
): void => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : defaultMessage;
    
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

// Fixed: Enhanced debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fixed: Reusable form dialog footer component
interface FormDialogFooterProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitText?: string;
  cancelText?: string;
}

function FormDialogFooter({ 
  onCancel, 
  isSubmitting, 
  submitText = "Save", 
  cancelText = "Cancel" 
}: FormDialogFooterProps) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {cancelText}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitText}
      </Button>
    </DialogFooter>
  );
}

// Fixed: Reusable user form fields component
interface UserFormFieldsProps {
  form: ReturnType<typeof useForm>;
  isEditing?: boolean;
}

function UserFormFields({ form, isEditing = false }: UserFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                type="email" 
                placeholder="user@example.com"
                aria-describedby="email-error"
                disabled={isEditing} // Don't allow email changes in edit mode
              />
            </FormControl>
            <FormMessage id="email-error" />
          </FormItem>
        )}
      />

      {!isEditing && (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="password" 
                  placeholder="Enter secure password"
                  aria-describedby="password-error"
                />
              </FormControl>
              <FormDescription>
                Must contain uppercase, lowercase, number, and special character
              </FormDescription>
              <FormMessage id="password-error" />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} aria-label="User role">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEditing && (
        <>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Allow this user to access the platform
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="User active status"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isBanned"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Ban Status</FormLabel>
                  <FormDescription>
                    Prevent this user from accessing the platform
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="User ban status"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("isBanned") && (
            <FormField
              control={form.control}
              name="banReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ban Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Reason for banning this user..."
                      aria-describedby="ban-reason-desc"
                    />
                  </FormControl>
                  <FormDescription id="ban-reason-desc">
                    Provide a clear reason for the ban
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}

// Fixed: Enhanced pagination component
interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

function PaginationControls({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange 
}: PaginationControlsProps) {
  const safeTotal = Math.max(0, totalItems);
  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));
  const startItem = safeTotal > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, safeTotal);

  return (
    <div className="flex items-center justify-between mt-4" role="navigation" aria-label="Pagination">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {safeTotal > 0 ? `Showing ${startItem}-${endItem} of ${safeTotal} items` : 'No items to display'}
        </span>
        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          aria-label="Items per page"
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fixed: Consolidated state management
  const [filters, setFilters] = useState<UserFilters>({
    role: "all",
    isActive: "all",
    isBanned: "all",
    search: ""
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    itemsPerPage: 10
  });
  
  const [modals, setModals] = useState<ModalState>({
    showCreateDialog: false,
    showEditDialog: false,
    showBanDialog: false,
    showDeleteDialog: false
  });
  
  const [banReason, setBanReason] = useState("");
  
  // Fixed: Debounced search to prevent excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  // Fixed: Enhanced form hooks with proper defaults
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "user",
      firstName: "",
      lastName: "",
      username: "",
    },
  });
  
  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      role: "user",
      firstName: "",
      lastName: "",
      isActive: true,
      isBanned: false,
      banReason: "",
    },
  });

  // Fixed: Modal management utilities
  const openModal = useCallback((modalType: keyof ModalState, user?: User) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
    if (user) {
      setSelectedUser(user);
      if (modalType === 'showEditDialog') {
        editForm.reset({
          email: user.email || "",
          role: user.role || "user",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          isActive: user.isActive ?? true,
          isBanned: user.isBanned ?? false,
          banReason: user.banReason || "",
        });
      }
    }
  }, [editForm]);

  const closeModal = useCallback((modalType: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setSelectedUser(null);
    // Fixed: Reset ban reason when closing ban dialog
    if (modalType === 'showBanDialog') {
      setBanReason("");
    }
  }, []);

  // Fixed: Enhanced clear filters with pagination reset
  const clearFilters = useCallback(() => {
    setFilters({
      role: "all",
      isActive: "all",
      isBanned: "all",
      search: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Fixed: Enhanced data fetching with proper error handling and apiRequest
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users', { ...filters, search: debouncedSearch }, pagination],
    queryFn: async (): Promise<User[]> => {
      const params = new URLSearchParams();
      
      // Apply filters
      Object.entries({ ...filters, search: debouncedSearch }).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });
      
      // Apply pagination
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.itemsPerPage.toString());

      try {
        const response = await apiRequest('GET', `/api/users?${params}`);
        const data = await response.json();
        
        // Fixed: Array null check
        return Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : [];
      } catch (error) {
        throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fixed: Calculate user stats with null checks
  const userStats = useMemo((): UserStats => {
    if (!Array.isArray(users)) {
      return { total: 0, active: 0, banned: 0, admins: 0 };
    }
    
    return {
      total: users.length,
      active: users.filter(u => u.isActive && !u.isBanned).length,
      banned: users.filter(u => u.isBanned).length,
      admins: users.filter(u => u.role === 'admin').length
    };
  }, [users]);

  // Fixed: Enhanced create user mutation with proper error handling
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormData): Promise<User> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('POST', '/api/admin/users', userData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      closeModal('showCreateDialog');
      createForm.reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      handleMutationError(error, toast, "Failed to create user");
    },
  });

  // Fixed: Enhanced update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: UpdateUserFormData }): Promise<User> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, userData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      closeModal('showEditDialog');
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      handleMutationError(error, toast, "Failed to update user");
    },
  });

  // Fixed: Enhanced ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }): Promise<void> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('POST', `/api/admin/users/${userId}/ban`, { reason });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to ban user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      closeModal('showBanDialog');
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    },
    onError: (error: Error) => {
      handleMutationError(error, toast, "Failed to ban user");
    },
  });

  // Fixed: Enhanced unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('POST', `/api/admin/users/${userId}/unban`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unban user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    },
    onError: (error: Error) => {
      handleMutationError(error, toast, "Failed to unban user");
    },
  });

  // Fixed: Enhanced delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      closeModal('showDeleteDialog');
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      handleMutationError(error, toast, "Failed to delete user");
    },
  });

  // Fixed: Enhanced CSV export with proper error handling
  const handleCsvExport = useCallback(async () => {
    try {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });

      const url = `/api/users/export/csv?${params}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: "Users exported successfully",
      });
    } catch (error) {
      handleMutationError(error, toast, "Failed to export users");
    }
  }, [filters, toast]);

  // Fixed: Form submission handlers with proper null checks
  const handleCreateUser = useCallback(async (data: CreateUserFormData) => {
    await createUserMutation.mutateAsync(data);
  }, [createUserMutation]);

  const handleUpdateUser = useCallback(async (data: UpdateUserFormData) => {
    if (!selectedUser?.id) {
      toast({
        title: "Error",
        description: "No user selected for update",
        variant: "destructive",
      });
      return;
    }
    await updateUserMutation.mutateAsync({ userId: selectedUser.id, userData: data });
  }, [selectedUser, updateUserMutation, toast]);

  const handleBanUser = useCallback(async () => {
    if (!selectedUser?.id) {
      toast({
        title: "Error",
        description: "No user selected for ban",
        variant: "destructive",
      });
      return;
    }
    if (!banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for banning",
        variant: "destructive",
      });
      return;
    }
    await banUserMutation.mutateAsync({ userId: selectedUser.id, reason: banReason.trim() });
  }, [selectedUser, banReason, banUserMutation, toast]);

  const handleUnbanUser = useCallback(async (userId: number) => {
    await unbanUserMutation.mutateAsync(userId);
  }, [unbanUserMutation]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser?.id) {
      toast({
        title: "Error",
        description: "No user selected for deletion",
        variant: "destructive",
      });
      return;
    }
    await deleteUserMutation.mutateAsync(selectedUser.id);
  }, [selectedUser, deleteUserMutation, toast]);

  // Fixed: Filtered and paginated users with null checks
  const paginatedUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return users.slice(startIndex, endIndex);
  }, [users, pagination]);

  // Render main component with proper error boundaries
  return (
    <SecurityErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600">Manage user accounts, permissions, and access control</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCsvExport} variant="outline" className="flex items-center space-x-2">
              <Icon name="download" size="sm" />
              <span>Export CSV</span>
            </Button>
            <Button onClick={() => openModal('showCreateDialog')} className="flex items-center space-x-2">
              <Icon name="plus" size="sm" />
              <span>Add User</span>
            </Button>
          </div>
        </div>

        {/* Fixed: Error handling display */}
        {error && (
          <Alert variant="destructive">
            <Icon name="alert-circle" className="h-4 w-4" />
            <AlertDescription>
              Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{userStats.total}</p>
                </div>
                <Icon name="users" className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold">{userStats.active}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Banned Users</p>
                  <p className="text-2xl font-bold">{userStats.banned}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Icon name="ban" className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold">{userStats.admins}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Icon name="shield" className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by email, name..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                    aria-label="Search users"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select 
                  value={filters.role} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={filters.isActive} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  <Icon name="filter-x" size="sm" className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({userStats.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading users...</span>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center p-8">
                <Icon name="users" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new user.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Icon name="user" className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getBadgeColor('role', user.role || 'user')}>
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getBadgeColor('status', user.isBanned ? 'banned' : user.isActive ? 'active' : 'inactive')}>
                            {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal('showEditDialog', user)}
                              aria-label={`Edit ${user.email}`}
                            >
                              <Icon name="edit" size="sm" />
                            </Button>
                            
                            {user.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbanUser(user.id)}
                                aria-label={`Unban ${user.email}`}
                              >
                                <Icon name="user-check" size="sm" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openModal('showBanDialog', user)}
                                aria-label={`Ban ${user.email}`}
                              >
                                <Icon name="ban" size="sm" />
                              </Button>
                            )}
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openModal('showDeleteDialog', user)}
                              aria-label={`Delete ${user.email}`}
                            >
                              <Icon name="trash-2" size="sm" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={pagination.page}
                  totalItems={userStats.total}
                  itemsPerPage={pagination.itemsPerPage}
                  onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  onItemsPerPageChange={(items) => setPagination({ page: 1, itemsPerPage: items })}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={modals.showCreateDialog} onOpenChange={() => closeModal('showCreateDialog')}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform with specific role and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                <UserFormFields form={createForm} isEditing={false} />
                <FormDialogFooter
                  onCancel={() => closeModal('showCreateDialog')}
                  isSubmitting={createUserMutation.isPending}
                  submitText="Create User"
                />
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={modals.showEditDialog} onOpenChange={() => closeModal('showEditDialog')}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <UserFormFields form={editForm} isEditing={true} />
                <FormDialogFooter
                  onCancel={() => closeModal('showEditDialog')}
                  isSubmitting={updateUserMutation.isPending}
                  submitText="Update User"
                />
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={modals.showBanDialog} onOpenChange={() => closeModal('showBanDialog')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Provide a reason for banning this user. This action can be reversed later.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Ban Reason *</Label>
                <Textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter the reason for banning this user..."
                  rows={3}
                  aria-describedby="ban-reason-help"
                />
                <p id="ban-reason-help" className="text-sm text-gray-500 mt-1">
                  Provide a clear explanation for this administrative action.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeModal('showBanDialog')}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleBanUser}
                disabled={banUserMutation.isPending || !banReason.trim()}
              >
                {banUserMutation.isPending ? "Banning..." : "Ban User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={modals.showDeleteDialog} onOpenChange={() => closeModal('showDeleteDialog')}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SecurityErrorBoundary>
  );
}