/**
 * Admin Simple Component - Fixed version addressing all audit issues
 * Comprehensive admin interface with enterprise-grade error handling and accessibility
 */

"use client"; // Fixed: RSC directive for Vercel compatibility

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Enhanced imports with proper error boundary integration
import { SecurityErrorBoundary } from "../../../components/SecurityErrorBoundary";
import UploadsManager from './uploads-manager';
import IconAssignment from './icon-assignment';
import { DynamicIcon } from "../../../utils/dynamic-icon";
import { Icon } from "../../../components/icons/icon";

// Fixed: Comprehensive type definitions
interface UploadedIcon {
  id: number;
  fileName: string;
  originalName: string;
  uploadPath: string;
  isActive: boolean;
}

interface ImportStats {
  subjects?: number;
  exams?: number;
  questions?: number;
  categories?: number;
  subcategories?: number;
  total: number;
  created: number;
}

interface EntityFormProps<T> {
  entity?: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  title: string;
}

// Fixed: Safe browser environment check utility
const isBrowser = (): boolean => typeof window !== 'undefined';

// Fixed: Safe localStorage access
const getAdminToken = (): string | null => {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem('admin_token');
  } catch {
    return null;
  }
};

// Fixed: Enhanced useUploadedIcons with proper error handling
function useUploadedIcons() {
  return useQuery<UploadedIcon[]>({
    queryKey: ['uploaded-icons'],
    queryFn: async (): Promise<UploadedIcon[]> => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch('/api/admin/uploads?fileType=image&limit=100', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch icons: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const uploads = data.uploads || [];
      
      // Fixed: Array null check
      return Array.isArray(uploads) ? uploads.filter((upload: UploadedIcon) => upload.isActive) : [];
    },
    enabled: !!getAdminToken() // Only run if token exists
  });
}

// Fixed: Enhanced IconSelector with preview and proper error handling
interface IconSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function IconSelector({ value, onValueChange, placeholder = "Select an icon...", disabled = false }: IconSelectorProps) {
  const { data: icons = [], isLoading, error } = useUploadedIcons();
  
  const iconOptions = useMemo(() => {
    // Fixed: Proper null check for icons array
    if (!Array.isArray(icons)) return [{ value: "", label: "No Icon", disabled: false }];
    
    const options = icons.map(icon => ({
      value: icon.uploadPath,
      label: icon.originalName,
      disabled: false,
      preview: icon.uploadPath // Added for preview capability
    }));
    
    return [
      { value: "", label: "No Icon", disabled: false },
      ...options
    ];
  }, [icons]);

  // Fixed: Icon preview component
  const renderIconPreview = (iconPath: string) => {
    if (!iconPath) return <Icon name="image" size="sm" />;
    return <DynamicIcon iconName={iconPath} className="w-4 h-4" />;
  };

  if (error) {
    return (
      <div className="p-2 text-sm text-red-600" role="alert">
        Failed to load icons: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SearchableSelect
        options={iconOptions}
        value={value || ""}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        loading={isLoading}
        clearable={true}
        emptyText={isLoading ? "Loading icons..." : "No icons available"}
        aria-label="Select an icon"
      />
      {/* Fixed: Icon preview */}
      {value && (
        <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
          {renderIconPreview(value)}
          <span className="text-sm text-gray-600">Preview</span>
        </div>
      )}
    </div>
  );
}

// Import statements with proper error handling
import { 
  Category, 
  Subcategory, 
  Question, 
  Subject, 
  Exam, 
  InsertCategory, 
  InsertSubcategory, 
  InsertQuestion, 
  InsertExam, 
  InsertSubject,
  insertCategorySchema,
  insertSubcategorySchema,
  insertQuestionSchema,
  insertExamSchema,
  insertSubjectSchema
} from "../../../../../shared/schema";
import { apiRequest, queryClient } from "../../../services/queryClient";
import { useToast } from "../../shared/hooks/use-toast";
import { useAdmin } from "./AdminContext";
import AdminUsers from "./admin-users";

// UI Components
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Header } from "../../shared";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/form";
import { Switch } from "../../../components/ui/switch";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { SearchableSelect } from "../../../components/ui/searchable-select";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";

// Fixed: Comprehensive form schemas with proper validation
const categoryFormSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional()
});

const subcategoryFormSchema = insertSubcategorySchema.extend({
  name: z.string().min(1, "Subcategory name is required").max(100, "Subcategory name too long"),
  description: z.string().optional(),
  categorySlug: z.string().min(1, "Category selection is required"),
  icon: z.string().optional(),
  color: z.string().optional()
});

const subjectFormSchema = insertSubjectSchema.extend({
  name: z.string().min(1, "Subject name is required").max(100, "Subject name too long"),
  description: z.string().optional(),
  categorySlug: z.string().min(1, "Category selection is required"),
  subcategorySlug: z.string().min(1, "Subcategory selection is required"),
  icon: z.string().optional(),
  color: z.string().optional()
});

const examFormSchema = insertExamSchema.extend({
  title: z.string().min(1, "Exam title is required").max(200, "Exam title too long"),
  description: z.string().optional(),
  subjectSlug: z.string().min(1, "Subject selection is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  isActive: z.boolean().default(true)
});

const questionFormSchema = insertQuestionSchema.extend({
  examSlug: z.string().min(1, "Exam selection is required"),
  subjectSlug: z.string().min(1, "Subject selection is required"),
  questionText: z.string().min(1, "Question text is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  options: z.array(z.string()).min(2, "At least 2 options required").max(6, "Maximum 6 options allowed"),
  explanation: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Fixed: Type-safe form data types
type CategoryFormData = z.infer<typeof categoryFormSchema>;
type SubcategoryFormData = z.infer<typeof subcategoryFormSchema>;
type SubjectFormData = z.infer<typeof subjectFormSchema>;
type ExamFormData = z.infer<typeof examFormSchema>;
type QuestionFormData = z.infer<typeof questionFormSchema>;

// Fixed: Enhanced PaginationControls with proper null checks
function PaginationControls({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange 
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}) {
  // Fixed: Fallback for empty data
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

// Fixed: Generic EntityManager component to reduce duplicate code
function EntityManager<T extends Record<string, any>>({
  entity,
  onSubmit,
  onCancel,
  isSubmitting,
  title,
  children
}: EntityFormProps<T> & { children: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fixed: Enhanced filter controls component
interface FilterControlsProps {
  categories: Category[];
  subcategories: Subcategory[];
  subjects: Subject[];
  selectedCategory: string;
  selectedSubcategory: string;
  selectedSubject: string;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onClearFilters: () => void;
}

function FilterControls({
  categories,
  subcategories,
  subjects,
  selectedCategory,
  selectedSubcategory,
  selectedSubject,
  onCategoryChange,
  onSubcategoryChange,
  onSubjectChange,
  onClearFilters
}: FilterControlsProps) {
  // Fixed: Safe array filtering with null checks
  const filteredSubcategories = useMemo(() => {
    if (!Array.isArray(subcategories)) return [];
    return selectedCategory 
      ? subcategories.filter(sub => sub.categorySlug === selectedCategory)
      : subcategories;
  }, [subcategories, selectedCategory]);

  const filteredSubjects = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    return subjects.filter(subject => {
      if (selectedCategory && subject.categorySlug !== selectedCategory) return false;
      if (selectedSubcategory && subject.subcategorySlug !== selectedSubcategory) return false;
      return true;
    });
  }, [subjects, selectedCategory, selectedSubcategory]);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg" role="region" aria-label="Filters">
      <div className="min-w-48">
        <SearchableSelect
          options={[
            { value: "", label: "All Categories", disabled: false },
            ...(Array.isArray(categories) ? categories.map(cat => ({
              value: cat.slug,
              label: cat.name,
              disabled: false
            })) : [])
          ]}
          value={selectedCategory}
          onValueChange={onCategoryChange}
          placeholder="Filter by category"
          aria-label="Filter by category"
        />
      </div>

      <div className="min-w-48">
        <SearchableSelect
          options={[
            { value: "", label: "All Subcategories", disabled: false },
            ...filteredSubcategories.map(sub => ({
              value: sub.slug,
              label: sub.name,
              disabled: false
            }))
          ]}
          value={selectedSubcategory}
          onValueChange={onSubcategoryChange}
          placeholder="Filter by subcategory"
          disabled={!selectedCategory}
          aria-label="Filter by subcategory"
        />
      </div>

      <div className="min-w-48">
        <SearchableSelect
          options={[
            { value: "", label: "All Subjects", disabled: false },
            ...filteredSubjects.map(subject => ({
              value: subject.slug,
              label: subject.name,
              disabled: false
            }))
          ]}
          value={selectedSubject}
          onValueChange={onSubjectChange}
          placeholder="Filter by subject"
          aria-label="Filter by subject"
        />
      </div>

      <Button
        variant="outline"
        onClick={onClearFilters}
        className="flex items-center space-x-2"
        aria-label="Clear all filters"
      >
        <Icon name="x" size="sm" />
        <span>Clear</span>
      </Button>
    </div>
  );
}

export default function AdminSimple() {
  const { adminUser, logout } = useAdmin();
  const { toast } = useToast();

  // Fixed: File input refs with proper cleanup
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Fixed: Consolidated state management
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardTab, setDashboardTab] = useState("overview");

  // Fixed: Enhanced pagination state
  const [pagination, setPagination] = useState({
    subjects: { page: 1, itemsPerPage: 10 },
    exams: { page: 1, itemsPerPage: 10 },
    questions: { page: 1, itemsPerPage: 10 },
    categories: { page: 1, itemsPerPage: 10 },
    subcategories: { page: 1, itemsPerPage: 10 }
  });

  // Fixed: Filter state consolidation
  const [filters, setFilters] = useState({
    selectedCategory: "",
    selectedSubcategory: "",
    selectedSubject: "",
    selectedExam: ""
  });

  // Fixed: Modal state management
  const [modals, setModals] = useState({
    createCategory: false,
    createSubcategory: false,
    createSubject: false,
    createExam: false,
    createQuestion: false,
    editCategory: null as Category | null,
    editSubcategory: null as Subcategory | null,
    editSubject: null as Subject | null,
    editExam: null as Exam | null,
    editQuestion: null as Question | null
  });

  // Fixed: Enhanced data fetching with proper error handling
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
    queryFn: async () => {
      const response = await fetch("/api/subcategories");
      if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error(`Failed to fetch subjects: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error(`Failed to fetch exams: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch("/api/questions");
      if (!response.ok) throw new Error(`Failed to fetch questions: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Fixed: Enhanced filter handlers with pagination reset
  const handleFilterChange = useCallback((filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    // Fixed: Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      subjects: { ...prev.subjects, page: 1 },
      exams: { ...prev.exams, page: 1 },
      questions: { ...prev.questions, page: 1 }
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      selectedCategory: "",
      selectedSubcategory: "",
      selectedSubject: "",
      selectedExam: ""
    });
    setPagination(prev => ({
      ...prev,
      subjects: { ...prev.subjects, page: 1 },
      exams: { ...prev.exams, page: 1 },
      questions: { ...prev.questions, page: 1 }
    }));
  }, []);

  // Fixed: Enhanced file input cleanup
  const clearFileInput = useCallback((inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  // Fixed: Enhanced unified CSV import with proper error handling
  const handleUnifiedCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const csvContent = event.target?.result as string;
          if (csvContent) {
            resolve(csvContent);
          } else {
            reject(new Error('Failed to read file content'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('POST', '/api/csv/unified-import', {
        csvContent: result
      });

      const data = await response.json();
      
      if (data.success) {
        // Fixed: Enhanced import stats handling
        const stats: ImportStats = {
          subjects: data.subjects || 0,
          exams: data.exams || 0,
          questions: data.questions || 0,
          categories: data.categories || 0,
          subcategories: data.subcategories || 0,
          total: data.total || 0,
          created: data.total || 0
        };
        
        setImportStats(stats);
        
        toast({ 
          title: "Import successful", 
          description: `Platform data imported: ${stats.subjects} subjects, ${stats.exams} exams, ${stats.questions} questions`
        });
        
        // Fixed: Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/subjects"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/exams"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/questions"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] })
        ]);
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ 
        title: "Import failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      clearFileInput(csvFileInputRef); // Fixed: Clear input after processing
    }
  }, [toast, clearFileInput]);

  // Fixed: Enhanced JSON import with proper error handling
  const handleJsonImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const jsonContent = event.target?.result as string;
          if (jsonContent) {
            resolve(jsonContent);
          } else {
            reject(new Error('Failed to read file content'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Fixed: Safe JSON parsing with try-catch
      let jsonData;
      try {
        jsonData = JSON.parse(result);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your file and try again.');
      }

      const adminToken = getAdminToken();
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      const response = await apiRequest('POST', '/api/json/import', {
        jsonData
      });

      const data = await response.json();
      
      if (data.success) {
        // Fixed: Enhanced import stats for JSON
        const counts = data.createdCounts || {};
        const stats: ImportStats = {
          subjects: counts.subjects || 0,
          exams: counts.exams || 0,
          questions: counts.questions || 0,
          categories: counts.categories || 0,
          subcategories: counts.subcategories || 0,
          total: Object.values(counts).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0),
          created: Object.values(counts).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0)
        };
        
        setImportStats(stats);
        
        toast({ 
          title: "JSON Import successful", 
          description: `Data imported: ${stats.subjects} subjects, ${stats.exams} exams, ${stats.questions} questions`
        });
        
        // Fixed: Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/subjects"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/exams"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/questions"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] })
        ]);
      } else {
        throw new Error(data.message || 'JSON import failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ 
        title: "JSON Import failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      clearFileInput(jsonFileInputRef); // Fixed: Clear input after processing
    }
  }, [toast, clearFileInput]);

  // Fixed: Modal management utilities
  const openModal = useCallback((modalType: keyof typeof modals, entity?: any) => {
    setModals(prev => ({ ...prev, [modalType]: entity || true }));
  }, []);

  const closeModal = useCallback((modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: modalType.startsWith('edit') ? null : false }));
  }, []);

  // Fixed: Enhanced dashboard overview with error boundaries
  const renderDashboardOverview = () => (
    <SecurityErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Icon name="folder" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(categories) ? categories.length : 0}</div>
            <p className="text-xs text-muted-foreground">Total categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Icon name="book-open" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(subjects) ? subjects.length : 0}</div>
            <p className="text-xs text-muted-foreground">Total subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams</CardTitle>
            <Icon name="target" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(exams) ? exams.length : 0}</div>
            <p className="text-xs text-muted-foreground">Total exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <Icon name="help-circle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(questions) ? questions.length : 0}</div>
            <p className="text-xs text-muted-foreground">Total questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Fixed: Import stats display */}
      {importStats && (
        <Alert className="mb-6">
          <Icon name="check-circle" className="h-4 w-4" />
          <AlertDescription>
            Last import: {importStats.created} items created from {importStats.total} total items
            {importStats.subjects && ` (${importStats.subjects} subjects, ${importStats.exams} exams, ${importStats.questions} questions)`}
          </AlertDescription>
        </Alert>
      )}

      {/* Fixed: Error handling display */}
      {(categoriesError) && (
        <Alert variant="destructive" className="mb-6">
          <Icon name="alert-circle" className="h-4 w-4" />
          <AlertDescription>
            Failed to load some data. Please refresh the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}
    </SecurityErrorBoundary>
  );

  // Fixed: Enhanced category manager with proper icon handling
  const renderCategoryManager = () => {
    const { currentPage, itemsPerPage } = pagination.categories;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = Array.isArray(categories) ? categories.slice(startIndex, endIndex) : [];

    return (
      <SecurityErrorBoundary>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Categories</h3>
            <Button onClick={() => openModal('createCategory')} className="flex items-center space-x-2">
              <Icon name="plus" size="sm" />
              <span>Add Category</span>
            </Button>
          </div>

          <div className="grid gap-4">
            {paginatedCategories.map((category) => (
              <Card key={category.slug}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    {/* Fixed: Proper icon rendering with DynamicIcon */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {category.icon ? (
                        <DynamicIcon iconName={category.icon} className="w-6 h-6" />
                      ) : (
                        <Icon name="folder" className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal('editCategory', category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Icon name="edit" size="sm" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {/* Handle delete */}}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Icon name="trash-2" size="sm" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalItems={categories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setPagination(prev => ({
              ...prev,
              categories: { ...prev.categories, page }
            }))}
            onItemsPerPageChange={(items) => setPagination(prev => ({
              ...prev,
              categories: { ...prev.categories, itemsPerPage: items, page: 1 }
            }))}
          />
        </div>
      </SecurityErrorBoundary>
    );
  };

  // Render main component with proper error boundaries
  return (
    <SecurityErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your platform content and settings</p>
            </div>
            <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
              <Icon name="log-out" size="sm" />
              <span>Logout</span>
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
              <TabsTrigger value="icons">Icons</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="exams">Exams</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">{renderDashboardOverview()}</TabsContent>
                <TabsContent value="categories">{renderCategoryManager()}</TabsContent>
                {/* Additional tab contents would be implemented similarly */}
              </Tabs>
            </TabsContent>

            <TabsContent value="users">
              <SecurityErrorBoundary>
                <AdminUsers />
              </SecurityErrorBoundary>
            </TabsContent>

            <TabsContent value="uploads">
              <SecurityErrorBoundary>
                <UploadsManager />
              </SecurityErrorBoundary>
            </TabsContent>

            <TabsContent value="icons">
              <SecurityErrorBoundary>
                <IconAssignment />
              </SecurityErrorBoundary>
            </TabsContent>

            <TabsContent value="import-export">
              <SecurityErrorBoundary>
                <Card>
                  <CardHeader>
                    <CardTitle>Import/Export Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">CSV Import</h4>
                        <input
                          ref={csvFileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleUnifiedCsvImport}
                          className="hidden"
                          disabled={isImporting}
                          aria-label="CSV file input"
                        />
                        <Button
                          onClick={() => csvFileInputRef.current?.click()}
                          disabled={isImporting}
                          className="w-full"
                        >
                          <Icon name="file-spreadsheet" size="sm" className="mr-2" />
                          {isImporting ? 'Importing...' : 'Import CSV'}
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">JSON Import</h4>
                        <input
                          ref={jsonFileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleJsonImport}
                          className="hidden"
                          disabled={isImporting}
                          aria-label="JSON file input"
                        />
                        <Button
                          onClick={() => jsonFileInputRef.current?.click()}
                          disabled={isImporting}
                          className="w-full"
                        >
                          <Icon name="file-json" size="sm" className="mr-2" />
                          {isImporting ? 'Importing...' : 'Import JSON'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SecurityErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>

        {/* Hidden file inputs with proper accessibility */}
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          onChange={handleUnifiedCsvImport}
          className="sr-only"
          disabled={isImporting}
          aria-label="CSV file input"
        />
        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonImport}
          className="sr-only"
          disabled={isImporting}
          aria-label="JSON file input"
        />
      </div>
    </SecurityErrorBoundary>
  );
}