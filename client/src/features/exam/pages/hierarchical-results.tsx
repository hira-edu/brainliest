import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UserSession, Question, Exam, Subject } from "@shared/schema";
import { ExamResult, DomainResult } from "@shared/types";
import { Header } from "../../shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface HierarchicalResultsProps {
  subjectSlug: string;
  examSlug: string;
  sessionId: string;
}

export default function HierarchicalResults({ 
  subjectSlug, 
  examSlug, 
  sessionId 
}: HierarchicalResultsProps) {
  const [, setLocation] = useLocation();

  // Fetch subject by slug
  const { data: subject } = useQuery<Subject>({
    queryKey: [`/api/subjects/slug/${subjectSlug}`],
    enabled: !!subjectSlug,
  });

  // Fetch exam by slug  
  const { data: exam } = useQuery<Exam>({
    queryKey: [`/api/exams/slug/${examSlug}`],
    enabled: !!examSlug,
  });

  // For now, we'll use mock results since we don't have session storage yet
  const mockResults: ExamResult = {
    score: 85,
    correct: 17,
    total: 20,
    timeSpent: "45:30",
    domains: [
      { name: "Project Management", correct: 8, total: 10, percentage: 80 },
      { name: "Risk Management", correct: 5, total: 6, percentage: 83 },
      { name: "Quality Management", correct: 4, total: 4, percentage: 100 }
    ]
  };

  const formatTime = (timeString: string) => {
    return timeString; // Already formatted
  };

  const handleRetakeExam = () => {
    setLocation(`/subject/${subjectSlug}/exam/${examSlug}`);
  };

  const handleBackToExams = () => {
    setLocation(`/subject/${subjectSlug}`);
  };

  const handleBackToSubjects = () => {
    setLocation('/subjects');
  };

  if (!subject || !exam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={handleBackToSubjects}
            className="hover:text-gray-900 transition-colors"
          >
            Subjects
          </button>
          <span>/</span>
          <button
            onClick={handleBackToExams}
            className="hover:text-gray-900 transition-colors"
          >
            {subject.name}
          </button>
          <span>/</span>
          <span className="text-gray-900">{exam.title} Results</span>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <i className="fas fa-check text-3xl text-green-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Complete!</h1>
          <p className="text-gray-600">Great job completing the {exam.title}</p>
        </div>

        {/* Score Overview */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-2">{mockResults.score}%</div>
            <p className="text-gray-600">Overall Score</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{mockResults.correct}/{mockResults.total}</div>
              <p className="text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{mockResults.timeSpent}</div>
              <p className="text-gray-600">Time Spent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {mockResults.score >= 70 ? 'PASS' : 'FAIL'}
              </div>
              <p className="text-gray-600">Result</p>
            </div>
          </div>
        </div>

        {/* Domain Performance */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance by Domain</h2>
          <div className="space-y-4">
            {mockResults.domains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{domain.name}</h3>
                  <p className="text-sm text-gray-600">{domain.correct}/{domain.total} correct</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        domain.percentage >= 80 ? 'bg-green-500' : 
                        domain.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${domain.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {domain.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleRetakeExam}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <i className="fas fa-redo mr-2"></i>Retake Exam
          </button>
          <button 
            onClick={handleBackToExams}
            className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <i className="fas fa-list mr-2"></i>Back to Exams
          </button>
        </div>
      </div>
    </div>
  );
}