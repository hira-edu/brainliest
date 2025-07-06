import { useState, useRef } from "react";
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
  Database,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

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

  function QuestionManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

    return (
      <div className="space-y-6">
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
          {questions?.map((question) => {
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}