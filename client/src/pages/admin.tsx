import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Question, Subject, Exam, InsertQuestion, InsertExam, InsertSubject } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, insertExamSchema, insertSubjectSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  FileText, 
  Book, 
  GraduationCap,
  Award,
  Settings,
  Tag,
  Filter,
  Search
} from "lucide-react";

// Form schemas with validation
const questionFormSchema = insertQuestionSchema.extend({
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  option4: z.string().min(1, "Option 4 is required"),
});

const examFormSchema = insertExamSchema.extend({
  tags: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

const subjectFormSchema = insertSubjectSchema.extend({
  tags: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;
type ExamFormData = z.infer<typeof examFormSchema>;
type SubjectFormData = z.infer<typeof subjectFormSchema>;

const categories = [
  { value: "certifications", label: "Professional Certifications", icon: Award },
  { value: "university", label: "University & College", icon: GraduationCap },
  { value: "other", label: "Other", icon: Book },
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];

const commonTags = [
  "Programming", "Web Development", "Data Science", "Cybersecurity", 
  "Cloud Computing", "Project Management", "Business", "Finance",
  "Mathematics", "Science", "Engineering", "Medicine", "Popular", "New"
];

export default function Admin() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("subjects");
  const { toast } = useToast();

  // Data queries
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  // Subject Management Component
  function SubjectManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const subjectForm = useForm<SubjectFormData>({
      resolver: zodResolver(subjectFormSchema),
      defaultValues: {
        name: "",
        description: "",
        icon: "fas fa-book",
        color: "blue",
        category: "",
        tags: "",
      }
    });

    const createSubjectMutation = useMutation({
      mutationFn: async (data: SubjectFormData) => {
        const { tags, category, ...subjectData } = data;
        await apiRequest("POST", "/api/subjects", subjectData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        toast({ title: "Subject created successfully!" });
        setIsDialogOpen(false);
        subjectForm.reset();
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

    const onSubmit = (data: SubjectFormData) => {
      createSubjectMutation.mutate(data);
    };

    const filteredSubjects = subjects?.filter(subject => 
      (selectedCategory === "all" || subject.name.toLowerCase().includes(selectedCategory)) &&
      (searchQuery === "" || subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       subject.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Subjects</h2>
            <p className="text-gray-600">Create and organize subject categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <Form {...subjectForm}>
                <form onSubmit={subjectForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={subjectForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PMP Certification" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={subjectForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={subjectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the subject..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={subjectForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon Class</FormLabel>
                          <FormControl>
                            <Input placeholder="fas fa-book" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={subjectForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["blue", "green", "red", "purple", "orange", "cyan", "pink"].map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={subjectForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (comma-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="popular, new, trending" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Quick tags:</span>
                    {commonTags.slice(0, 8).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          const currentTags = subjectForm.getValues("tags") || "";
                          const newTags = currentTags ? `${currentTags}, ${tag}` : tag;
                          subjectForm.setValue("tags", newTags);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSubjectMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Create Subject
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-${subject.color}-100 flex items-center justify-center`}>
                      <i className={`${subject.icon} text-${subject.color}-600`}></i>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubjectMutation.mutate(subject.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{subject.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ID: {subject.id}</span>
                  <span className={`px-2 py-1 rounded bg-${subject.color}-100 text-${subject.color}-700`}>
                    {subject.color}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Exam Management Component
  function ExamManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const examForm = useForm<ExamFormData>({
      resolver: zodResolver(examFormSchema),
      defaultValues: {
        subjectId: 0,
        title: "",
        description: "",
        questionCount: 50,
        duration: 90,
        difficulty: "Intermediate",
        category: "",
        tags: "",
      }
    });

    const createExamMutation = useMutation({
      mutationFn: async (data: ExamFormData) => {
        const { tags, category, ...examData } = data;
        await apiRequest("POST", "/api/exams", examData);
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

    const onSubmit = (data: ExamFormData) => {
      createExamMutation.mutate(data);
    };

    const filteredExams = exams?.filter(exam => {
      const subject = subjects?.find(s => s.id === exam.subjectId);
      return (searchQuery === "" || 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }) || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Exams</h2>
            <p className="text-gray-600">Create and organize practice exams</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PMP Practice Exam 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
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
                  </div>

                  <FormField
                    control={examForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the exam..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={examForm.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Questions</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficulties.map((diff) => (
                                <SelectItem key={diff} value={diff}>
                                  {diff}
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={examForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="popular, practice, certification" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExamMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Create Exam
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const subject = subjects?.find(s => s.id === exam.subjectId);
            return (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <p className="text-sm text-gray-600">{subject?.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{exam.difficulty}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExamMutation.mutate(exam.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{exam.questionCount} questions</span>
                    <span>{exam.duration} minutes</span>
                    <span>ID: {exam.id}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Question Management Component
  function QuestionManager() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<string>("");

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

    const filteredQuestions = questions?.filter(question => {
      const exam = exams?.find(e => e.id === question.examId);
      const subject = subjects?.find(s => s.id === question.subjectId);
      
      return (
        (selectedExam === "" || question.examId.toString() === selectedExam) &&
        (searchQuery === "" || 
          question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }) || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Questions</h2>
            <p className="text-gray-600">Create and organize exam questions</p>
          </div>
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
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={questionForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
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
                      control={questionForm.control}
                      name="examId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {exams?.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id.toString()}>
                                  {exam.title}
                                </SelectItem>
                              ))}
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficulties.map((diff) => (
                                <SelectItem key={diff} value={diff}>
                                  {diff}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={questionForm.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the question..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <h4 className="font-medium">Answer Options</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={questionForm.control}
                      name="correctAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
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
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain/Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Planning, Security" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
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
                          />
                        </FormControl>
                        <FormMessage />
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
        </div>

        {/* Filter Controls */}
        <div className="flex gap-4">
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Exams</SelectItem>
              {exams?.map((exam) => (
                <SelectItem key={exam.id} value={exam.id.toString()}>
                  {exam.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const exam = exams?.find(e => e.id === question.examId);
            const subject = subjects?.find(s => s.id === question.subjectId);
            
            return (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{subject?.name}</Badge>
                        <Badge variant="secondary">{exam?.title}</Badge>
                        <Badge>{question.difficulty}</Badge>
                        {question.domain && <Badge variant="outline">{question.domain}</Badge>}
                      </div>
                      <CardTitle className="text-base">{question.text}</CardTitle>
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
                  <div className="flex justify-between text-xs text-gray-500 mt-3">
                    <span>Order: {question.order}</span>
                    <span>ID: {question.id}</span>
                  </div>
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage subjects, exams, questions, and content organization</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects" className="flex items-center space-x-2">
              <Book className="w-4 h-4" />
              <span>Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Exams</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Questions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <SubjectManager />
          </TabsContent>

          <TabsContent value="exams">
            <ExamManager />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}