import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Subject, Exam } from "@shared/schema";
import ExamCard from "../components/exam-card";
import { Header } from "../../shared";

export default function ExamSelection() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/subject/:id");
  const subjectId = params?.id ? parseInt(params.id) : null;

  const { data: subject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
    enabled: !!subjectId,
  });

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams", subjectId],
    queryFn: async () => {
      const response = await fetch(`/api/exams?subjectId=${subjectId}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!subjectId,
  });

  const handleStartExam = (examId: number) => {
    setLocation(`/exam/${examId}`);
  };

  const handleGoBack = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-primary mr-4"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Subjects
          </button>
          <div className="flex items-center">
            <i className={`${subject?.icon} text-2xl text-primary mr-3`}></i>
            <h2 className="text-3xl font-bold text-gray-900">{subject?.name}</h2>
          </div>
        </div>

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
