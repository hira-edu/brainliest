"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { queryClient } from "../../../services/queryClient";
import { useToast } from "../../shared/hooks/use-toast";
import { DynamicIcon } from "../../../utils/dynamic-icon";
import { 
  ArrowRight, 
  Link, 
  GitBranch, 
  Database, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Layers,
  Target,
  BookOpen,
  FileText
} from "lucide-react";

interface RelationshipOverview {
  hierarchicalData: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    subcategories: {
      slug: string;
      name: string;
      description: string;
      icon: string;
      subjects: {
        slug: string;
        name: string;
        description: string;
        icon: string;
        exams: {
          slug: string;
          title: string;
          description: string;
          icon: string;
        }[];
      }[];
    }[];
    directSubjects: {
      slug: string;
      name: string;
      description: string;
      icon: string;
      exams: {
        slug: string;
        title: string;
        description: string;
        icon: string;
      }[];
    }[];
  }[];
  counts: {
    categories: number;
    subcategories: number;
    subjects: number;
    exams: number;
  };
}

export default function RelationshipManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"subcategory-to-category" | "subject-to-category" | "exam-to-subject">("subcategory-to-category");
  
  const { toast } = useToast();

  // Fetch hierarchical overview
  const { data: overview, isLoading: isOverviewLoading, refetch } = useQuery<RelationshipOverview>({
    queryKey: ['/api/admin/relationships/overview'],
    queryFn: async () => {
      const response = await fetch('/api/admin/relationships/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    }
  });

  // Fetch individual lists for assignment dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['/api/subcategories'],
    queryFn: async () => {
      const response = await fetch('/api/subcategories');
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      return response.json();
    }
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    }
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['/api/exams'],
    queryFn: async () => {
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    }
  });

  // Assignment mutations
  const assignSubcategoryMutation = useMutation({
    mutationFn: async ({ subcategorySlug, categorySlug }: { subcategorySlug: string; categorySlug: string }) => {
      const response = await fetch('/api/admin/relationships/subcategory-to-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ subcategorySlug, categorySlug })
      });
      if (!response.ok) throw new Error('Failed to assign subcategory');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subcategory assigned to category successfully",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/subcategories'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const assignSubjectMutation = useMutation({
    mutationFn: async ({ subjectSlug, categorySlug, subcategorySlug }: { subjectSlug: string; categorySlug?: string; subcategorySlug?: string }) => {
      const response = await fetch('/api/admin/relationships/subject-to-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ subjectSlug, categorySlug, subcategorySlug })
      });
      if (!response.ok) throw new Error('Failed to assign subject');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject assigned to category/subcategory successfully",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const assignExamMutation = useMutation({
    mutationFn: async ({ examSlug, subjectSlug }: { examSlug: string; subjectSlug: string }) => {
      const response = await fetch('/api/admin/relationships/exam-to-subject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ examSlug, subjectSlug })
      });
      if (!response.ok) throw new Error('Failed to assign exam');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam assigned to subject successfully",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAssignment = () => {
    if (assignmentType === "subcategory-to-category") {
      if (!selectedSubcategory || !selectedCategory) {
        toast({
          title: "Error",
          description: "Please select both subcategory and category",
          variant: "destructive",
        });
        return;
      }
      assignSubcategoryMutation.mutate({ subcategorySlug: selectedSubcategory, categorySlug: selectedCategory });
    } else if (assignmentType === "subject-to-category") {
      if (!selectedSubject || (!selectedCategory && !selectedSubcategory)) {
        toast({
          title: "Error",
          description: "Please select subject and either category or subcategory",
          variant: "destructive",
        });
        return;
      }
      assignSubjectMutation.mutate({ 
        subjectSlug: selectedSubject, 
        categorySlug: selectedCategory || undefined,
        subcategorySlug: selectedSubcategory || undefined
      });
    } else if (assignmentType === "exam-to-subject") {
      if (!selectedExam || !selectedSubject) {
        toast({
          title: "Error",
          description: "Please select both exam and subject",
          variant: "destructive",
        });
        return;
      }
      assignExamMutation.mutate({ examSlug: selectedExam, subjectSlug: selectedSubject });
    }
  };

  const resetSelections = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedSubject("");
    setSelectedExam("");
  };

  if (isOverviewLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading relationship overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Layers className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <div className="text-2xl font-bold">{overview?.counts.categories || 0}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <GitBranch className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <div className="text-2xl font-bold">{overview?.counts.subcategories || 0}</div>
                <div className="text-sm text-gray-600">Subcategories</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <div className="text-2xl font-bold">{overview?.counts.subjects || 0}</div>
                <div className="text-sm text-gray-600">Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <div className="text-2xl font-bold">{overview?.counts.exams || 0}</div>
                <div className="text-sm text-gray-600">Exams</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Manage Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assignment Type</label>
              <Select value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subcategory-to-category">Subcategory → Category</SelectItem>
                  <SelectItem value="subject-to-category">Subject → Category/Subcategory</SelectItem>
                  <SelectItem value="exam-to-subject">Exam → Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button 
                onClick={handleAssignment}
                disabled={assignSubcategoryMutation.isPending || assignSubjectMutation.isPending || assignExamMutation.isPending}
                className="flex-1"
              >
                {(assignSubcategoryMutation.isPending || assignSubjectMutation.isPending || assignExamMutation.isPending) && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                Assign Relationship
              </Button>
              <Button variant="outline" onClick={resetSelections}>
                Reset
              </Button>
            </div>
          </div>

          {/* Dynamic Assignment Fields */}
          {assignmentType === "subcategory-to-category" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subcategory</label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub: any) => (
                      <SelectItem key={sub.slug} value={sub.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={sub.icon} className="h-4 w-4 mr-2" />
                          {sub.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={cat.icon} className="h-4 w-4 mr-2" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {assignmentType === "subject-to-category" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj: any) => (
                      <SelectItem key={subj.slug} value={subj.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={subj.icon} className="h-4 w-4 mr-2" />
                          {subj.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category (optional)</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={cat.icon} className="h-4 w-4 mr-2" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subcategory (optional)</label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub: any) => (
                      <SelectItem key={sub.slug} value={sub.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={sub.icon} className="h-4 w-4 mr-2" />
                          {sub.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {assignmentType === "exam-to-subject" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam</label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam: any) => (
                      <SelectItem key={exam.slug} value={exam.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={exam.icon} className="h-4 w-4 mr-2" />
                          {exam.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj: any) => (
                      <SelectItem key={subj.slug} value={subj.slug}>
                        <div className="flex items-center">
                          <DynamicIcon name={subj.icon} className="h-4 w-4 mr-2" />
                          {subj.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Hierarchical Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview?.hierarchicalData.map((category) => (
              <div key={category.slug} className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <DynamicIcon name={category.icon} className="h-5 w-5 mr-2" />
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <Badge variant="outline" className="ml-2">
                    {category.subcategories.length} subcategories
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {category.directSubjects.length} direct subjects
                  </Badge>
                </div>
                
                {/* Subcategories */}
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.slug} className="ml-4 mb-3 border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center mb-2">
                      <ArrowRight className="h-4 w-4 mr-2 text-gray-400" />
                      <DynamicIcon name={subcategory.icon} className="h-4 w-4 mr-2" />
                      <span className="font-medium">{subcategory.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {subcategory.subjects.length} subjects
                      </Badge>
                    </div>
                    
                    {/* Subjects in subcategory */}
                    {subcategory.subjects.map((subject) => (
                      <div key={subject.slug} className="ml-6 mb-2">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                          <DynamicIcon name={subject.icon} className="h-4 w-4 mr-2" />
                          <span className="text-sm">{subject.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {subject.exams.length} exams
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                
                {/* Direct subjects */}
                {category.directSubjects.map((subject) => (
                  <div key={subject.slug} className="ml-4 mb-2">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                      <DynamicIcon name={subject.icon} className="h-4 w-4 mr-2" />
                      <span className="text-sm">{subject.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {subject.exams.length} exams
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}