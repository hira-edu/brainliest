import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Question, Subject, Exam, InsertQuestion, InsertExam, InsertSubject } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, insertExamSchema, insertSubjectSchema } from "@shared/schema";
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
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  option4: z.string().min(1, "Option 4 is required"),
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

  // Icon suggestions and search functionality
  const [iconSearchTerm, setIconSearchTerm] = useState("");
  const [showIconSuggestions, setShowIconSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowIconSuggestions(false);
      }
    };

    if (showIconSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconSuggestions]);
  
  const getUsedIcons = () => {
    const icons = subjects?.map(s => s.icon).filter(Boolean) || [];
    return Array.from(new Set(icons)); // Remove duplicates
  };

  const commonIcons = [
    "chart", "cloud", "shield", "network", "laptop", "calculator", 
    "beaker", "briefcase", "coins", "wrench", "heart", "leaf",
    "atom", "server", "tree", "book", "graduation-cap", "code",
    "database", "gear", "lock", "globe", "star", "lightning"
  ];

  const getFilteredIconSuggestions = (searchTerm: string) => {
    if (!searchTerm) return Array.from(new Set([...getUsedIcons(), ...commonIcons])).slice(0, 12);
    
    const filtered = Array.from(new Set([...getUsedIcons(), ...commonIcons]))
      .filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return filtered.slice(0, 12);
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
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <FormControl>
                                <Input 
                                  placeholder="Search or type icon name (e.g., chart, cloud, shield)" 
                                  {...field} 
                                  value={field.value || ""} 
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    setIconSearchTerm(e.target.value);
                                    // Only show suggestions if there's text
                                    setShowIconSuggestions(e.target.value.length > 0);
                                  }}
                                  onBlur={(e) => {
                                    // Only hide suggestions if clicking outside the suggestions area
                                    setTimeout(() => {
                                      const relatedTarget = e.relatedTarget as Element | null;
                                      if (!relatedTarget || !relatedTarget.closest('.icon-suggestions')) {
                                        setShowIconSuggestions(false);
                                      }
                                    }, 150);
                                  }}
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <div className="flex items-center justify-center w-10 h-10 text-sm font-medium border-2 rounded-md bg-gray-50">
                                {field.value}
                              </div>
                            )}
                          </div>
                          {showIconSuggestions && iconSearchTerm.length > 0 && (
                            <div className="icon-suggestions border rounded-lg p-3 bg-white shadow-sm relative z-10">
                              <p className="text-xs text-gray-600 mb-2">Click to select:</p>
                              <div className="grid grid-cols-6 gap-2">
                                {getFilteredIconSuggestions(iconSearchTerm).map((icon, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="flex items-center justify-center w-12 h-8 text-xs font-medium border rounded hover:bg-gray-100 hover:border-blue-400 transition-colors"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur event
                                      field.onChange(icon);
                                      setShowIconSuggestions(false);
                                      setIconSearchTerm("");
                                    }}
                                    title={`Use "${icon}"`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
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
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <FormControl>
                                <Input 
                                  placeholder="Search or type icon name (e.g., chart, cloud, shield)" 
                                  {...field} 
                                  value={field.value || ""} 
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    setIconSearchTerm(e.target.value);
                                    // Only show suggestions if there's text
                                    setShowIconSuggestions(e.target.value.length > 0);
                                  }}
                                  onBlur={(e) => {
                                    // Only hide suggestions if clicking outside the suggestions area
                                    setTimeout(() => {
                                      const relatedTarget = e.relatedTarget as Element | null;
                                      if (!relatedTarget || !relatedTarget.closest('.icon-suggestions')) {
                                        setShowIconSuggestions(false);
                                      }
                                    }, 150);
                                  }}
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <div className="flex items-center justify-center w-10 h-10 text-sm font-medium border-2 rounded-md bg-gray-50">
                                {field.value}
                              </div>
                            )}
                          </div>
                          {showIconSuggestions && iconSearchTerm.length > 0 && (
                            <div className="icon-suggestions border rounded-lg p-3 bg-white shadow-sm relative z-10">
                              <p className="text-xs text-gray-600 mb-2">Click to select:</p>
                              <div className="grid grid-cols-6 gap-2">
                                {getFilteredIconSuggestions(iconSearchTerm).map((icon, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="flex items-center justify-center w-12 h-8 text-xs font-medium border rounded hover:bg-gray-100 hover:border-blue-400 transition-colors"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur event
                                      field.onChange(icon);
                                      setShowIconSuggestions(false);
                                      setIconSearchTerm("");
                                    }}
                                    title={`Use "${icon}"`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
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
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 text-base border rounded ml-3 overflow-hidden">
                      <span className="truncate text-center">
                        {(subject.icon && subject.icon.length <= 3) ? subject.icon : "📚"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
        duration: 0,
        questionCount: 0,
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
        questionCount: 0,
        duration: 0,
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
        questionCount: exam.questionCount,
        duration: exam.duration || 0,
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editExamForm.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editExamForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                              value={field.value || ""} 
                            />
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
                  </div>
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
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: 0,
        explanation: "",
        domain: "",
        difficulty: "Intermediate",
        order: 1,
      }
    });

    const createQuestionMutation = useMutation({
      mutationFn: async (data: QuestionFormData) => {
        const { option1, option2, option3, option4, ...questionData } = data;
        const questionDataWithOptions: InsertQuestion = {
          ...questionData,
          options: [option1, option2, option3, option4],
        };
        await apiRequest("POST", "/api/questions", questionDataWithOptions);
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
        const { option1, option2, option3, option4, ...questionData } = data;
        const questionDataWithOptions: Partial<InsertQuestion> = {
          ...questionData,
          options: [option1, option2, option3, option4],
        };
        await apiRequest("PUT", `/api/questions/${editingQuestion.id}`, questionDataWithOptions);
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
      const options = question.options || [];
      questionForm.reset({
        examId: question.examId,
        subjectId: question.subjectId,
        text: question.text,
        option1: options[0] || "",
        option2: options[1] || "",
        option3: options[2] || "",
        option4: options[3] || "",
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || "",
        domain: question.domain || "",
        difficulty: question.difficulty,
        order: question.order,
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
              <DialogContent className="max-w-2xl">
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

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={questionForm.control}
                        name="option1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option A</FormLabel>
                            <FormControl>
                              <Input placeholder="First option..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option B</FormLabel>
                            <FormControl>
                              <Input placeholder="Second option..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option C</FormLabel>
                            <FormControl>
                              <Input placeholder="Third option..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option D</FormLabel>
                            <FormControl>
                              <Input placeholder="Fourth option..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
              <DialogContent className="max-w-2xl">
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

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={questionForm.control}
                        name="option1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option A</FormLabel>
                            <FormControl>
                              <Input placeholder="First option..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option B</FormLabel>
                            <FormControl>
                              <Input placeholder="Second option..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option C</FormLabel>
                            <FormControl>
                              <Input placeholder="Third option..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="option4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option D</FormLabel>
                            <FormControl>
                              <Input placeholder="Fourth option..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={questionForm.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select correct option" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Option A</SelectItem>
                                <SelectItem value="1">Option B</SelectItem>
                                <SelectItem value="2">Option C</SelectItem>
                                <SelectItem value="3">Option D</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Subject:</span>
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
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Exam:</span>
            </div>
            <Select value={selectedExamFilter} onValueChange={setSelectedExamFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams?.filter((exam) => 
                  selectedSubjectFilter === "all" || exam.subjectId.toString() === selectedSubjectFilter
                ).map((exam) => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(selectedSubjectFilter !== "all" || selectedExamFilter !== "all" || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSubjectFilter("all");
                  setSelectedExamFilter("all");
                  setSearchTerm("");
                  setQuestionsPage(1);
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
              {(selectedSubjectFilter !== "all" || selectedExamFilter !== "all" || searchTerm) && ' (filtered)'}
            </p>
          </div>
        </div>

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
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage questions, exams, and subjects with CSV import/export functionality</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardOverview />
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