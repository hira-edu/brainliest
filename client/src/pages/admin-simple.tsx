import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Category, Subcategory, Question, Subject, Exam, InsertCategory, InsertSubcategory, InsertQuestion, InsertExam, InsertSubject } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import AdminUsers from "@/pages/admin-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, insertSubcategorySchema, insertQuestionSchema, insertExamSchema, insertSubjectSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Trash2, 
  Save, 
  Download,
  Upload,
  FileSpreadsheet,
  Edit,
  Database,
  AlertCircle,
  BarChart3,
  Users,
  BookOpen,
  Target,
  Copy,
  Tag,
  Search,
  Filter,
  Eye,
  Settings
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Pagination component
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
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {totalItems} items
        </span>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">per page</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Form schemas
const questionFormSchema = insertQuestionSchema.extend({
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.number()).optional(),
  allowMultipleAnswers: z.boolean().default(false),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export default function AdminSimple() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{created: number, total: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  
  // Pagination state for each tab
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [examsPage, setExamsPage] = useState(1);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [subjectsPerPage, setSubjectsPerPage] = useState(10);
  const [examsPerPage, setExamsPerPage] = useState(10);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);
  
  // Selected filters for linking tabs
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  // Shared mutations for creating categories and subcategories
  const createCategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertCategorySchema>) => 
      apiRequest("POST", `/api/categories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create category", variant: "destructive" });
      console.error("Error creating category:", error);
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertSubcategorySchema>) => 
      apiRequest("POST", `/api/subcategories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: "Subcategory created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create subcategory", variant: "destructive" });
      console.error("Error creating subcategory:", error);
    },
  });

  // Track previously used icons
  const getUsedIcons = () => {
    const icons = subjects?.map(s => s.icon).filter((icon): icon is string => Boolean(icon)) || [];
    return Array.from(new Set(icons)); // Remove duplicates
  };

  // CSV Template Generation
  const generateCSVTemplate = () => {
    const headers = [
      "Subject ID", "Subject Name", "Exam ID", "Exam Title", "Question Text",
      "Option A", "Option B", "Option C", "Option D", "Correct Answer (0-3)",
      "Explanation", "Domain", "Difficulty", "Order"
    ];
    
    const sampleData = [
      "1", "PMP Certification", "1", "PMP Practice Exam 1", 
      "What is the primary purpose of project management?",
      "To complete projects on time", "To manage resources effectively", 
      "To deliver value to stakeholders", "To reduce project costs",
      "2", "Project management focuses on delivering value to stakeholders through successful project outcomes.",
      "Project Management Fundamentals", "Intermediate", "1"
    ];

    const csvContent = [headers, sampleData].map(row => 
      row.map(field => `"${field}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "questions_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "CSV template downloaded successfully!" });
  };

  // CSV Export
  const exportQuestionsCSV = () => {
    if (!questions || questions.length === 0) {
      toast({ title: "No questions to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Question ID", "Subject ID", "Subject Name", "Exam ID", "Exam Title", "Question Text",
      "Option A", "Option B", "Option C", "Option D", "Correct Answer (0-3)",
      "Explanation", "Domain", "Difficulty", "Order"
    ];

    const csvData = questions.map(question => {
      const subject = subjects?.find(s => s.id === question.subjectId);
      const exam = exams?.find(e => e.id === question.examId);
      return [
        question.id,
        question.subjectId,
        subject?.name || "",
        question.examId,
        exam?.title || "",
        question.text,
        question.options[0] || "",
        question.options[1] || "",
        question.options[2] || "",
        question.options[3] || "",
        question.correctAnswer,
        question.explanation || "",
        question.domain || "",
        question.difficulty || "",
        question.order
      ];
    });

    const csvContent = [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `questions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Questions exported successfully!" });
  };

  // CSV Import
  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const questions: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length >= 14) {
        const questionData = {
          subjectId: parseInt(values[0]) || 1,
          examId: parseInt(values[2]) || 1,
          text: values[4] || "",
          options: [
            values[5] || "",
            values[6] || "",
            values[7] || "",
            values[8] || ""
          ],
          correctAnswer: parseInt(values[9]) || 0,
          explanation: values[10] || "",
          domain: values[11] || "",
          difficulty: values[12] || "Intermediate",
          order: parseInt(values[13]) || 1
        };
        
        if (questionData.text && questionData.options.every(opt => opt)) {
          questions.push(questionData);
        }
      }
    }
    
    return questions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ title: "Please select a CSV file", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setImportStats(null);

    try {
      const text = await file.text();
      const questions = parseCSVData(text);
      
      if (questions.length === 0) {
        toast({ 
          title: "No valid questions found", 
          description: "Please check your CSV format",
          variant: "destructive" 
        });
        return;
      }

      const response = await apiRequest("POST", "/api/questions/bulk", { questions }) as any;
      
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      
      setImportStats({
        created: response.created,
        total: response.total
      });
      
      toast({ 
        title: "CSV imported successfully!", 
        description: `${response.created} out of ${response.total} questions imported`
      });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Import failed", 
        description: "Please check your CSV format and try again",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteAllQuestions = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/questions/all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setImportStats(null);
      toast({ title: "All questions deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete questions", variant: "destructive" });
    }
  });

  // Dashboard Overview Component
  function DashboardOverview() {
    const totalSubjects = subjects?.length || 0;
    const totalExams = exams?.length || 0;
    const totalQuestions = questions?.length || 0;
    
    // Calculate question distribution
    const questionsBySubject = subjects?.map(subject => ({
      name: subject.name,
      count: questions?.filter(q => q.subjectId === subject.id).length || 0
    })) || [];

    const questionsByExam = exams?.map(exam => ({
      title: exam.title,
      count: questions?.filter(q => q.examId === exam.id).length || 0
    })) || [];

    // Most popular exam (most questions)
    const popularExam = questionsByExam.sort((a, b) => b.count - a.count)[0];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Platform statistics and quick insights</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubjects}</div>
              <p className="text-xs text-gray-600">Active certification categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExams}</div>
              <p className="text-xs text-gray-600">Practice exam sets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions}</div>
              <p className="text-xs text-gray-600">In question bank</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{popularExam?.title?.substring(0, 15) || "No Data"}</div>
              <p className="text-xs text-gray-600">{popularExam?.count || 0} questions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionsBySubject.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="outline">{item.count} questions</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions by Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionsByExam.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.title}</span>
                    <Badge variant="outline">{item.count} questions</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subject Management Component  
  // Categories Management Component
  function CategoryManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    const categoryForm = useForm<z.infer<typeof insertCategorySchema>>({
      resolver: zodResolver(insertCategorySchema),
      defaultValues: {
        name: "",
        description: "",
        icon: "",
        color: "",
        isActive: true,
        sortOrder: 0,
      },
    });

    const editCategoryForm = useForm<z.infer<typeof insertCategorySchema>>({
      resolver: zodResolver(insertCategorySchema),
      defaultValues: {
        name: "",
        description: "",
        icon: "",
        color: "",
        isActive: true,
        sortOrder: 0,
      },
    });

    const updateCategoryMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: z.infer<typeof insertCategorySchema> }) => 
        apiRequest("PUT", `/api/categories/${id}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        editCategoryForm.reset();
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        toast({ title: "Category updated successfully!" });
      },
      onError: (error) => {
        toast({ title: "Failed to update category", variant: "destructive" });
        console.error("Error updating category:", error);
      },
    });

    const deleteCategoryMutation = useMutation({
      mutationFn: (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: "Category deleted successfully!" });
      },
      onError: (error) => {
        toast({ title: "Failed to delete category", variant: "destructive" });
        console.error("Error deleting category:", error);
      },
    });

    const onSubmit = (data: z.infer<typeof insertCategorySchema>) => {
      createCategoryMutation.mutate(data);
    };

    const onEditSubmit = (data: z.infer<typeof insertCategorySchema>) => {
      if (editingCategory) {
        updateCategoryMutation.mutate({ id: editingCategory.id, data });
      }
    };

    const handleEditCategory = (category: Category) => {
      setEditingCategory(category);
      editCategoryForm.reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        color: category.color || "",
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      });
      setIsEditDialogOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Categories</h2>
            <p className="text-gray-600">Create and organize main subject categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Professional Certifications" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., fas fa-certificate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categories ({categories?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {category.icon && <span className={category.icon}></span>}
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <p className="text-xs text-gray-500">Sort Order: {category.sortOrder}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <Form {...editCategoryForm}>
              <form onSubmit={editCategoryForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editCategoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Professional Certifications" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCategoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCategoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., fas fa-certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCategoryForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Subcategories Management Component  
  function SubcategoryManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    const subcategoryForm = useForm<z.infer<typeof insertSubcategorySchema>>({
      resolver: zodResolver(insertSubcategorySchema),
      defaultValues: {
        categoryId: 0,
        name: "",
        description: "",
        icon: "",
        color: "",
        isActive: true,
        sortOrder: 0,
      },
    });

    const editSubcategoryForm = useForm<z.infer<typeof insertSubcategorySchema>>({
      resolver: zodResolver(insertSubcategorySchema),
      defaultValues: {
        categoryId: 0,
        name: "",
        description: "",
        icon: "",
        color: "",
        isActive: true,
        sortOrder: 0,
      },
    });

    const updateSubcategoryMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: z.infer<typeof insertSubcategorySchema> }) => 
        apiRequest("PUT", `/api/subcategories/${id}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        editSubcategoryForm.reset();
        setIsEditDialogOpen(false);
        setEditingSubcategory(null);
        toast({ title: "Subcategory updated successfully!" });
      },
      onError: (error) => {
        toast({ title: "Failed to update subcategory", variant: "destructive" });
        console.error("Error updating subcategory:", error);
      },
    });

    const deleteSubcategoryMutation = useMutation({
      mutationFn: (id: number) => apiRequest("DELETE", `/api/subcategories/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        toast({ title: "Subcategory deleted successfully!" });
      },
      onError: (error) => {
        toast({ title: "Failed to delete subcategory", variant: "destructive" });
        console.error("Error deleting subcategory:", error);
      },
    });

    const onSubmit = (data: z.infer<typeof insertSubcategorySchema>) => {
      createSubcategoryMutation.mutate(data);
    };

    const onEditSubmit = (data: z.infer<typeof insertSubcategorySchema>) => {
      if (editingSubcategory) {
        updateSubcategoryMutation.mutate({ id: editingSubcategory.id, data });
      }
    };

    const handleEditSubcategory = (subcategory: Subcategory) => {
      setEditingSubcategory(subcategory);
      editSubcategoryForm.reset({
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        description: subcategory.description || "",
        icon: subcategory.icon || "",
        color: subcategory.color || "",
        isActive: subcategory.isActive,
        sortOrder: subcategory.sortOrder,
      });
      setIsEditDialogOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Subcategories</h2>
            <p className="text-gray-600">Create subcategories within main categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subcategory</DialogTitle>
              </DialogHeader>
              <Form {...subcategoryForm}>
                <form onSubmit={subcategoryForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={subcategoryForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subcategoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., IT & Cloud Computing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subcategoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subcategoryForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., fas fa-cloud" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subcategoryForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createSubcategoryMutation.isPending}>
                    {createSubcategoryMutation.isPending ? "Creating..." : "Create Subcategory"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subcategories ({subcategories?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subcategories?.map((subcategory) => {
                const parentCategory = categories?.find(cat => cat.id === subcategory.categoryId);
                return (
                  <div key={subcategory.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {subcategory.icon && <span className={subcategory.icon}></span>}
                      <div>
                        <h3 className="font-medium">{subcategory.name}</h3>
                        <p className="text-sm text-gray-600">{subcategory.description}</p>
                        <p className="text-xs text-gray-500">
                          Parent: {parentCategory?.name} | Sort Order: {subcategory.sortOrder}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSubcategory(subcategory)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSubcategoryMutation.mutate(subcategory.id)}
                        disabled={deleteSubcategoryMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subcategory</DialogTitle>
            </DialogHeader>
            <Form {...editSubcategoryForm}>
              <form onSubmit={editSubcategoryForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editSubcategoryForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSubcategoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IT & Cloud Computing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSubcategoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSubcategoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., fas fa-cloud" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSubcategoryForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateSubcategoryMutation.isPending}>
                  {updateSubcategoryMutation.isPending ? "Updating..." : "Update Subcategory"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  function SubjectManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const subjectForm = useForm<InsertSubject>({
      resolver: zodResolver(insertSubjectSchema),
      defaultValues: {
        name: "",
        description: "",
        icon: "",
        categoryId: undefined,
        subcategoryId: undefined,
      }
    });

    const createSubjectMutation = useMutation({
      mutationFn: async (data: InsertSubject) => {
        await apiRequest("POST", "/api/subjects", data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        toast({ title: "Subject created successfully!" });
        setIsDialogOpen(false);
        subjectForm.reset();
      },
    });

    const editSubjectForm = useForm<InsertSubject>({
      resolver: zodResolver(insertSubjectSchema),
      defaultValues: {
        name: "",
        description: "",
        icon: "",
        categoryId: undefined,
        subcategoryId: undefined,
      }
    });

    const updateSubjectMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number; data: InsertSubject }) => {
        await apiRequest("PUT", `/api/subjects/${id}`, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        toast({ title: "Subject updated successfully!" });
        setIsEditDialogOpen(false);
        setEditingSubject(null);
        editSubjectForm.reset();
      },
    });

    const deleteSubjectMutation = useMutation({
      mutationFn: async (id: number) => {
        await apiRequest("DELETE", `/api/subjects/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        toast({ title: "Subject deleted successfully!" });
      },
    });

    const onSubmit = (data: InsertSubject) => {
      createSubjectMutation.mutate(data);
    };

    const onEditSubmit = (data: InsertSubject) => {
      if (editingSubject) {
        updateSubjectMutation.mutate({ id: editingSubject.id, data });
      }
    };

    const handleEditSubject = (subject: Subject) => {
      setEditingSubject(subject);
      editSubjectForm.reset({
        name: subject.name,
        description: subject.description || "",
        icon: subject.icon || "",
        categoryId: subject.categoryId || undefined,
        subcategoryId: subject.subcategoryId || undefined,
      });
      setIsEditDialogOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Subjects</h2>
            <p className="text-gray-600">Create and organize certification categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <Form {...subjectForm}>
                <form onSubmit={subjectForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={subjectForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PMP Certification" {...field} value={field.value || ""} />
                        </FormControl>
                        <div className="text-xs text-gray-600 mt-1">
                          💡 For automatic categorization, include keywords like: "certification", "aws", "pmp", "statistics", "programming", "engineering", etc.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subjectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subjectForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" type="button">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Category</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input placeholder="Category name" id="quick-category-name" />
                                <Textarea placeholder="Description (optional)" id="quick-category-desc" />
                                <Input placeholder="Icon (optional)" id="quick-category-icon" />
                                <Button onClick={() => {
                                  const name = (document.getElementById('quick-category-name') as HTMLInputElement)?.value;
                                  const description = (document.getElementById('quick-category-desc') as HTMLTextAreaElement)?.value;
                                  const icon = (document.getElementById('quick-category-icon') as HTMLInputElement)?.value;
                                  if (name) {
                                    createCategoryMutation.mutate({
                                      name,
                                      description: description || "",
                                      icon: icon || "",
                                      color: "",
                                      isActive: true,
                                      sortOrder: categories?.length || 0
                                    });
                                  }
                                }}>
                                  Create Category
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subjectForm.control}
                    name="subcategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subcategories?.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" type="button">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Subcategory</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={(value) => {
                                  const elem = document.getElementById('quick-subcategory-parent') as HTMLInputElement;
                                  if (elem) elem.value = value;
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select parent category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories?.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input type="hidden" id="quick-subcategory-parent" />
                                <Input placeholder="Subcategory name" id="quick-subcategory-name" />
                                <Textarea placeholder="Description (optional)" id="quick-subcategory-desc" />
                                <Input placeholder="Icon (optional)" id="quick-subcategory-icon" />
                                <Button onClick={() => {
                                  const categoryId = (document.getElementById('quick-subcategory-parent') as HTMLInputElement)?.value;
                                  const name = (document.getElementById('quick-subcategory-name') as HTMLInputElement)?.value;
                                  const description = (document.getElementById('quick-subcategory-desc') as HTMLTextAreaElement)?.value;
                                  const icon = (document.getElementById('quick-subcategory-icon') as HTMLInputElement)?.value;
                                  if (categoryId && name) {
                                    createSubcategoryMutation.mutate({
                                      categoryId: parseInt(categoryId),
                                      name,
                                      description: description || "",
                                      icon: icon || "",
                                      color: "",
                                      isActive: true,
                                      sortOrder: subcategories?.length || 0
                                    });
                                  }
                                }}>
                                  Create Subcategory
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subjectForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 relative">
                            <FormControl>
                              <Input 
                                placeholder="Icon class or emoji" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            {getUsedIcons().length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-2"
                                    type="button"
                                  >
                                    ▼
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" onWheel={(e) => e.stopPropagation()}>
                                  <div className="p-3 space-y-1 max-h-48 overflow-y-auto overscroll-contain scroll-smooth">
                                    {getUsedIcons().map((icon, index) => (
                                      <Button
                                        key={index}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 justify-start text-xs p-2 font-mono"
                                        onClick={() => field.onChange(icon)}
                                        type="button"
                                        title={icon}
                                      >
                                        <span className="truncate">{icon}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          {field.value && (
                            <div className="flex items-center justify-center w-8 h-8 text-sm border rounded overflow-hidden">
                              <span className="text-xs truncate px-1" title={field.value}>
                                {field.value}
                              </span>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSubjectMutation.isPending}>
                      Create Subject
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Subject Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subject</DialogTitle>
              </DialogHeader>
              <Form {...editSubjectForm}>
                <form onSubmit={editSubjectForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editSubjectForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PMP Certification" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editSubjectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editSubjectForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" type="button">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Category</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input placeholder="Category name" id="edit-quick-category-name" />
                                <Textarea placeholder="Description (optional)" id="edit-quick-category-desc" />
                                <Input placeholder="Icon (optional)" id="edit-quick-category-icon" />
                                <Button onClick={() => {
                                  const name = (document.getElementById('edit-quick-category-name') as HTMLInputElement)?.value;
                                  const description = (document.getElementById('edit-quick-category-desc') as HTMLTextAreaElement)?.value;
                                  const icon = (document.getElementById('edit-quick-category-icon') as HTMLInputElement)?.value;
                                  if (name) {
                                    createCategoryMutation.mutate({
                                      name,
                                      description: description || "",
                                      icon: icon || "",
                                      color: "",
                                      isActive: true,
                                      sortOrder: categories?.length || 0
                                    });
                                  }
                                }}>
                                  Create Category
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editSubjectForm.control}
                    name="subcategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subcategories?.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" type="button">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Subcategory</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={(value) => {
                                  const elem = document.getElementById('edit-quick-subcategory-parent') as HTMLInputElement;
                                  if (elem) elem.value = value;
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select parent category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories?.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input type="hidden" id="edit-quick-subcategory-parent" />
                                <Input placeholder="Subcategory name" id="edit-quick-subcategory-name" />
                                <Textarea placeholder="Description (optional)" id="edit-quick-subcategory-desc" />
                                <Input placeholder="Icon (optional)" id="edit-quick-subcategory-icon" />
                                <Button onClick={() => {
                                  const categoryId = (document.getElementById('edit-quick-subcategory-parent') as HTMLInputElement)?.value;
                                  const name = (document.getElementById('edit-quick-subcategory-name') as HTMLInputElement)?.value;
                                  const description = (document.getElementById('edit-quick-subcategory-desc') as HTMLTextAreaElement)?.value;
                                  const icon = (document.getElementById('edit-quick-subcategory-icon') as HTMLInputElement)?.value;
                                  if (categoryId && name) {
                                    createSubcategoryMutation.mutate({
                                      categoryId: parseInt(categoryId),
                                      name,
                                      description: description || "",
                                      icon: icon || "",
                                      color: "",
                                      isActive: true,
                                      sortOrder: subcategories?.length || 0
                                    });
                                  }
                                }}>
                                  Create Subcategory
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editSubjectForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 relative">
                            <FormControl>
                              <Input 
                                placeholder="Icon class or emoji" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            {getUsedIcons().length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-2"
                                    type="button"
                                  >
                                    ▼
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" onWheel={(e) => e.stopPropagation()}>
                                  <div className="p-3 space-y-1 max-h-48 overflow-y-auto overscroll-contain scroll-smooth">
                                    {getUsedIcons().map((icon, index) => (
                                      <Button
                                        key={index}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 justify-start text-xs p-2 font-mono"
                                        onClick={() => field.onChange(icon)}
                                        type="button"
                                        title={icon}
                                      >
                                        <span className="truncate">{icon}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          {field.value && (
                            <div className="flex items-center justify-center w-8 h-8 text-sm border rounded overflow-hidden">
                              <span className="text-xs truncate px-1" title={field.value}>
                                {field.value}
                              </span>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateSubjectMutation.isPending}>
                      Update Subject
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {subjects?.slice((subjectsPage - 1) * subjectsPerPage, subjectsPage * subjectsPerPage).map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-between flex-1 mr-4">
                    <div>
                      <CardTitle className="text-base font-semibold">{subject.name}</CardTitle>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-4" title={subject.icon || "📚"}>
                      {subject.icon || "📚"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="outline">
                      {exams?.filter(e => e.subjectId === subject.id).length || 0} exams
                    </Badge>
                    <Badge variant="outline">
                      {questions?.filter(q => q.subjectId === subject.id).length || 0} questions
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleEditSubject(subject);
                      }}
                      title="Edit subject"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubjectFilter(subject.id.toString());
                        setExamsPage(1); // Reset exams page when filtering
                      }}
                      title="View exams for this subject"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubjectMutation.mutate(subject.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <PaginationControls
          currentPage={subjectsPage}
          totalItems={subjects?.length || 0}
          itemsPerPage={subjectsPerPage}
          onPageChange={setSubjectsPage}
          onItemsPerPageChange={(items) => {
            setSubjectsPerPage(items);
            setSubjectsPage(1);
          }}
        />
      </div>
    );
  }



  // Exam Management Component
  function ExamManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const examForm = useForm<InsertExam>({
      resolver: zodResolver(insertExamSchema),
      defaultValues: {
        subjectId: 0,
        title: "",
        description: "",
        difficulty: "Intermediate",
      }
    });

    const createExamMutation = useMutation({
      mutationFn: async (data: InsertExam) => {
        await apiRequest("POST", "/api/exams", data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        toast({ title: "Exam created successfully!" });
        setIsDialogOpen(false);
        examForm.reset();
      },
    });

    const deleteExamMutation = useMutation({
      mutationFn: async (id: number) => {
        await apiRequest("DELETE", `/api/exams/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        toast({ title: "Exam deleted successfully!" });
      },
    });

    const editExamForm = useForm<InsertExam>({
      resolver: zodResolver(insertExamSchema),
      defaultValues: {
        subjectId: 0,
        title: "",
        description: "",
        difficulty: "",
      }
    });

    const updateExamMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number; data: InsertExam }) => {
        await apiRequest("PUT", `/api/exams/${id}`, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        toast({ title: "Exam updated successfully!" });
        setIsEditDialogOpen(false);
        setEditingExam(null);
        editExamForm.reset();
      },
    });

    const cloneExamMutation = useMutation({
      mutationFn: async (exam: Exam) => {
        const clonedExam = {
          ...exam,
          title: `${exam.title} (Copy)`,
        };
        delete (clonedExam as any).id;
        await apiRequest("POST", "/api/exams", clonedExam);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        toast({ title: "Exam cloned successfully!" });
      },
    });

    const onSubmit = (data: InsertExam) => {
      createExamMutation.mutate(data);
    };

    const onEditSubmit = (data: InsertExam) => {
      if (editingExam) {
        updateExamMutation.mutate({ id: editingExam.id, data });
      }
    };

    const handleEditExam = (exam: Exam) => {
      setEditingExam(exam);
      editExamForm.reset({
        subjectId: exam.subjectId,
        title: exam.title,
        description: exam.description || "",
        difficulty: exam.difficulty,
      });
      setIsEditDialogOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Exams</h2>
            <p className="text-gray-600">Create, clone, and organize practice exams</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={examForm.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PMP Practice Exam 1" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Exam description..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={examForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExamMutation.isPending}>
                      Create Exam
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Exam Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Exam</DialogTitle>
              </DialogHeader>
              <Form {...editExamForm}>
                <form onSubmit={editExamForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editExamForm.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editExamForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PMP Practice Exam 1" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editExamForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editExamForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateExamMutation.isPending}>
                      Update Exam
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filter by Subject:</span>
            </div>
            <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubjectFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubjectFilter("all")}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {exams?.filter((exam) => 
            selectedSubjectFilter === "all" || exam.subjectId.toString() === selectedSubjectFilter
          ).slice((examsPage - 1) * examsPerPage, examsPage * examsPerPage).map((exam) => {
            const subject = subjects?.find(s => s.id === exam.subjectId);
            const questionCount = questions?.filter(q => q.examId === exam.id).length || 0;

            return (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Subject: {subject?.name}</span>
                        <span>Duration: {exam.duration} min</span>
                        <span>Target: {exam.questionCount} questions</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{questionCount} questions</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExam(exam)}
                        title="Edit exam"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedExamFilter(exam.id.toString());
                          setQuestionsPage(1); // Reset questions page when filtering
                        }}
                        title="View questions for this exam"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cloneExamMutation.mutate(exam)}
                        title="Clone exam"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExamMutation.mutate(exam.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        
        <PaginationControls
          currentPage={examsPage}
          totalItems={exams?.filter((exam) => 
            selectedSubjectFilter === "all" || exam.subjectId.toString() === selectedSubjectFilter
          ).length || 0}
          itemsPerPage={examsPerPage}
          onPageChange={setExamsPage}
          onItemsPerPageChange={(items) => {
            setExamsPerPage(items);
            setExamsPage(1);
          }}
        />
      </div>
    );
  }

  function QuestionManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Filter questions based on search and selections - use filter states for hierarchical linking
    const filteredQuestions = questions?.filter(question => {
      const matchesSearch = !searchTerm || 
        question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.explanation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.domain?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubjectFilter === "all" || 
        question.subjectId.toString() === selectedSubjectFilter;
      
      const matchesExam = selectedExamFilter === "all" || 
        question.examId.toString() === selectedExamFilter;

      return matchesSearch && matchesSubject && matchesExam;
    }) || [];

    const questionForm = useForm<QuestionFormData>({
      resolver: zodResolver(questionFormSchema),
      defaultValues: {
        examId: 0,
        subjectId: 0,
        text: "",
        options: ["", ""],
        correctAnswer: 0,
        correctAnswers: [],
        allowMultipleAnswers: false,
        explanation: "",
        domain: "",
        difficulty: "Intermediate",
        order: 1,
      }
    });

    const createQuestionMutation = useMutation({
      mutationFn: async (data: QuestionFormData) => {
        // Filter out empty options
        const cleanOptions = data.options.filter(option => option.trim() !== "");
        const questionData: InsertQuestion = {
          ...data,
          options: cleanOptions,
          correctAnswers: data.allowMultipleAnswers ? data.correctAnswers : null,
        };
        await apiRequest("POST", "/api/questions", questionData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        toast({ title: "Question created successfully!" });
        setIsDialogOpen(false);
        questionForm.reset();
      },
    });

    const updateQuestionMutation = useMutation({
      mutationFn: async (data: QuestionFormData) => {
        if (!editingQuestion) return;
        // Filter out empty options
        const cleanOptions = data.options.filter(option => option.trim() !== "");
        const questionData: Partial<InsertQuestion> = {
          ...data,
          options: cleanOptions,
          correctAnswers: data.allowMultipleAnswers ? data.correctAnswers : null,
        };
        await apiRequest("PUT", `/api/questions/${editingQuestion.id}`, questionData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        toast({ title: "Question updated successfully!" });
        setIsEditDialogOpen(false);
        setEditingQuestion(null);
        questionForm.reset();
      },
    });

    const deleteQuestionMutation = useMutation({
      mutationFn: async (id: number) => {
        await apiRequest("DELETE", `/api/questions/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        toast({ title: "Question deleted successfully!" });
      },
    });

    const onSubmit = (data: QuestionFormData) => {
      createQuestionMutation.mutate(data);
    };

    const onEditSubmit = (data: QuestionFormData) => {
      updateQuestionMutation.mutate(data);
    };

    const handleEditQuestion = (question: Question) => {
      setEditingQuestion(question);
      questionForm.reset({
        examId: question.examId,
        subjectId: question.subjectId,
        text: question.text,
        options: question.options || ["", ""],
        correctAnswer: question.correctAnswer,
        correctAnswers: question.correctAnswers || [],
        allowMultipleAnswers: question.allowMultipleAnswers || false,
        explanation: question.explanation || "",
        domain: question.domain || "",
        difficulty: question.difficulty,
        order: question.order || 1,
      });
      setIsEditDialogOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Manage Questions</h2>
              <p className="text-gray-600">Create and organize exam questions with CSV import/export</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateCSVTemplate}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={exportQuestionsCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteAllQuestions.mutate()}
              disabled={deleteAllQuestions.isPending}
            >
              <Database className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Question</DialogTitle>
                </DialogHeader>
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the question..."
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Answer Options
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange([...(field.value || []), ""])}
                              className="ml-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </Button>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {(field.value || [""]).map((option: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="w-8 text-sm font-medium">
                                    {String.fromCharCode(65 + index)}:
                                  </span>
                                  <Input
                                    placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(field.value || [])];
                                      newOptions[index] = e.target.value;
                                      field.onChange(newOptions);
                                    }}
                                    className="flex-1"
                                  />
                                  {(field.value || []).length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = [...(field.value || [])];
                                        newOptions.splice(index, 1);
                                        field.onChange(newOptions);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="allowMultipleAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Multiple Correct Answers</FormLabel>
                            <FormDescription>
                              Allow users to select more than one correct answer
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createQuestionMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Create Question
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Question Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Question</DialogTitle>
                </DialogHeader>
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the question..."
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Answer Options
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange([...(field.value || []), ""])}
                              className="ml-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </Button>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {(field.value || [""]).map((option: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="w-8 text-sm font-medium">
                                    {String.fromCharCode(65 + index)}:
                                  </span>
                                  <Input
                                    placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(field.value || [])];
                                      newOptions[index] = e.target.value;
                                      field.onChange(newOptions);
                                    }}
                                    className="flex-1"
                                  />
                                  {(field.value || []).length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = [...(field.value || [])];
                                        newOptions.splice(index, 1);
                                        field.onChange(newOptions);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="allowMultipleAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Multiple Correct Answers</FormLabel>
                            <FormDescription>
                              Allow users to select more than one correct answer
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Correct Answer Selection */}
                    <FormField
                      control={questionForm.control}
                      name="allowMultipleAnswers"
                      render={({ field: allowMultipleField }) => (
                        <FormItem>
                          <FormLabel>
                            {allowMultipleField.value ? "Correct Answers (Multiple)" : "Correct Answer (Single)"}
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {questionForm.watch("options")?.map((option: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type={allowMultipleField.value ? "checkbox" : "radio"}
                                    id={`answer-${index}`}
                                    name="correctAnswer"
                                    value={index}
                                    checked={
                                      allowMultipleField.value
                                        ? questionForm.watch("correctAnswers")?.includes(index) || false
                                        : questionForm.watch("correctAnswer") === index
                                    }
                                    onChange={(e) => {
                                      if (allowMultipleField.value) {
                                        // Multiple choice logic
                                        const currentAnswers = questionForm.watch("correctAnswers") || [];
                                        if (e.target.checked) {
                                          questionForm.setValue("correctAnswers", [...currentAnswers, index]);
                                        } else {
                                          questionForm.setValue("correctAnswers", currentAnswers.filter(i => i !== index));
                                        }
                                      } else {
                                        // Single choice logic
                                        questionForm.setValue("correctAnswer", index);
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <label htmlFor={`answer-${index}`} className="text-sm">
                                    {String.fromCharCode(65 + index)}: {option || `Option ${String.fromCharCode(65 + index)}`}
                                  </label>
                                </div>
                              )) || []}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={questionForm.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                                <SelectItem value="Expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={questionForm.control}
                      name="explanation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Explanation</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Explain why this is the correct answer..."
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateQuestionMutation.isPending}>
                        Update Question
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search questions by text, domain, or explanation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams?.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">{filteredQuestions.length} questions</Badge>
          </div>
        </div>

        {importStats && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully imported {importStats.created} out of {importStats.total} questions from CSV file.
            </AlertDescription>
          </Alert>
        )}
        


        <div className="space-y-4">
          {filteredQuestions.slice((questionsPage - 1) * questionsPerPage, questionsPage * questionsPerPage).map((question) => {
            const exam = exams?.find(e => e.id === question.examId);
            const subject = subjects?.find(s => s.id === question.subjectId);
            
            return (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{question.text}</CardTitle>
                      <p className="text-sm text-gray-600">{subject?.name} - {exam?.title}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                        title="Edit question"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestionMutation.mutate(question.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded text-sm ${
                          index === question.correctAnswer 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-gray-50'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <PaginationControls
          currentPage={questionsPage}
          totalItems={filteredQuestions.length}
          itemsPerPage={questionsPerPage}
          onPageChange={setQuestionsPage}
          onItemsPerPageChange={(items) => {
            setQuestionsPerPage(items);
            setQuestionsPage(1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage questions, exams, and subjects with CSV import/export functionality</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardOverview />
          </TabsContent>
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
          <TabsContent value="subcategories">
            <SubcategoryManager />
          </TabsContent>
          <TabsContent value="subjects">
            <SubjectManager />
          </TabsContent>
          <TabsContent value="exams">
            <ExamManager />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <p className="text-gray-600">Advanced analytics features coming soon</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">Detailed question performance, user stats, and exam analytics will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}