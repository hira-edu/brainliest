"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Header, Footer, SEOHead } from "../../shared";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Users, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicIcon } from "../../../utils/dynamic-icon";
import ExamCard from "../../exam/components/exam-card";

interface SubcategoryDetailPageProps {
  subcategorySlug: string;
}

interface Exam {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  duration: number;
  questionCount: number;
  subjectSlug: string;
}

interface Subject {
  slug: string;
  name: string;
  description: string;
  icon: string;
  categorySlug: string;
  subcategorySlug: string;
  examCount: number;
  questionCount: number;
}

export default function SubcategoryDetailPage({ subcategorySlug }: SubcategoryDetailPageProps) {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState("name");
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [examsPage, setExamsPage] = useState(1);
  const subjectsPerPage = 6;
  const examsPerPage = 6;

  // Fetch exams for this subcategory
  const { data: exams = [], isLoading: isExamsLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams/subcategory', subcategorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/exams/subcategory/${subcategorySlug}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!subcategorySlug
  });

  // Fetch subjects for this subcategory
  const { data: subjects = [], isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects', subcategorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/subjects?subcategorySlug=${subcategorySlug}`);
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    },
    enabled: !!subcategorySlug
  });

  // Get subcategory information
  const { data: subcategory, isLoading: isSubcategoryLoading } = useQuery({
    queryKey: ['/api/subcategories', subcategorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/subcategories/${subcategorySlug}`);
      if (!response.ok) throw new Error('Failed to fetch subcategory');
      return response.json();
    },
    enabled: !!subcategorySlug
  });

  // Sort exams
  const sortedExams = useMemo(() => {
    if (!exams.length) return [];
    
    const sorted = [...exams];
    switch (sortBy) {
      case "difficulty":
        return sorted.sort((a, b) => {
          const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
        });
      case "duration":
        return sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case "questions":
        return sorted.sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0));
      default:
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [exams, sortBy]);

  const handleStartExam = (examSlug: string) => {
    setLocation(`/exam/${examSlug}`);
  };

  const goBack = () => {
    setLocation('/categories');
  };

  // Pagination calculations for subjects
  const subjectsTotalPages = Math.ceil(subjects.length / subjectsPerPage);
  const paginatedSubjects = subjects.slice(
    (subjectsPage - 1) * subjectsPerPage,
    subjectsPage * subjectsPerPage
  );

  // Pagination calculations for exams
  const examsTotalPages = Math.ceil(sortedExams.length / examsPerPage);
  const paginatedExams = sortedExams.slice(
    (examsPage - 1) * examsPerPage,
    examsPage * examsPerPage
  );

  if (isSubcategoryLoading || isExamsLoading || isSubjectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${subcategory?.name || 'Subcategory'} - Exam Preparation | Brainliest`}
        description={`Explore ${subcategory?.name || 'subcategory'} exam preparation materials and practice tests.`}
        keywords={[
          subcategory?.name || 'exam preparation',
          'certification exams',
          'practice tests',
          'study materials'
        ]}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </Button>
        </div>

        {/* Subcategory Header */}
        {subcategory && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <DynamicIcon 
                  name={subcategory.icon || 'book-open'} 
                  className="w-8 h-8 text-primary"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{subcategory.name}</h1>
                <p className="text-gray-600 mt-1">{subcategory.description}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{subjects.length} subjects</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{exams.length} exams</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{exams.reduce((total, exam) => total + (exam.questionCount || 0), 0)} questions</span>
              </div>
            </div>
          </div>
        )}

        {/* Subjects Section */}
        {subjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Subjects ({subjects.length})</h2>
              {subjectsTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubjectsPage(p => Math.max(1, p - 1))}
                    disabled={subjectsPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {subjectsPage} of {subjectsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubjectsPage(p => Math.min(subjectsTotalPages, p + 1))}
                    disabled={subjectsPage === subjectsTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSubjects.map((subject) => (
                <Card 
                  key={subject.slug} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/20 active:scale-95 hover:bg-gray-50/50"
                  onClick={() => setLocation(`/subject/${subject.slug}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${subject.name} subject with ${subject.examCount} exams and ${subject.questionCount} questions`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLocation(`/subject/${subject.slug}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DynamicIcon 
                          name={subject.icon || 'book-open'} 
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{subject.name}</CardTitle>
                        <p className="text-sm text-gray-600">{subject.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{subject.examCount} exams</span>
                      <span>{subject.questionCount} questions</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Exams Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Exams {exams.length > 0 && `(${exams.length})`}
            </h2>
            
            <div className="flex items-center gap-4">
              {exams.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="duration">Duration</option>
                    <option value="questions">Questions</option>
                  </select>
                </div>
              )}
              
              {examsTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExamsPage(p => Math.max(1, p - 1))}
                    disabled={examsPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {examsPage} of {examsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExamsPage(p => Math.min(examsTotalPages, p + 1))}
                    disabled={examsPage === examsTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {sortedExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedExams.map((exam) => (
                <ExamCard 
                  key={exam.slug} 
                  exam={exam} 
                  onStart={() => handleStartExam(exam.slug)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
                  <p className="text-gray-600">
                    There are no exams available for this subcategory yet. Check back later or explore other categories.
                  </p>
                </div>
                <Button onClick={goBack} variant="outline">
                  Browse Other Categories
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}