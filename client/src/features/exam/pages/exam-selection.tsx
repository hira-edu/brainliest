import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Subject, Exam } from "@shared/schema";
import ExamCard from "../components/exam-card";
import { Header } from "../../shared";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamSelection() {
  const [, setLocation] = useLocation();
  
  // Check both ID and slug routes
  const [matchId, paramsId] = useRoute("/subject/:id");
  const [matchSlug, paramsSlug] = useRoute("/subject/:slug");
  
  const subjectParam = paramsId?.id || paramsSlug?.slug;
  const isNumericId = subjectParam && !isNaN(Number(subjectParam));

  // Get subject by ID or slug based on parameter type
  const { data: subject } = useQuery<Subject>({
    queryKey: isNumericId ? [`/api/subjects/${subjectParam}`] : [`/api/subjects/by-slug/${subjectParam}`],
    enabled: !!subjectParam,
  });

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams", subject?.id],
    queryFn: async () => {
      const response = await fetch(`/api/exams?subjectId=${subject?.id}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!subject?.id,
  });

  const handleStartExam = (examId: number) => {
    // Navigate directly to the exam interface using exam ID
    setLocation(`/exam/${examId}`);
  };

  const handleGoBack = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Subject Header with Back Button - Loading State */}
        {subject && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Subjects
                  </Button>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{subject.name}</h1>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Loading exams...</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Subject Header with Back Button - Same structure as question interface */}
      {subject && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subjects
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{subject.name}</h1>
                  <p className="text-sm text-gray-600">{subject.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{exams?.length || 0} available exams</div>
                <div className="text-xs text-gray-500">
                  {subject.examCount} exams • {subject.questionCount} questions
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams?.map((exam) => (
            <ExamCard 
              key={exam.id} 
              exam={exam} 
              onStart={() => handleStartExam(exam.id)}
              // Completion tracking implemented via user sessions and analytics
            />
          ))}
        </div>
      </div>
    </div>
  );
}
