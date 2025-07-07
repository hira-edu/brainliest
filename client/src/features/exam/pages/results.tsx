import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { UserSession, Question, Exam } from "@shared/schema";
import { ExamResult, DomainResult } from "../../../shared/types";
import { Header } from "../../shared";

export default function Results() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/results/:id");
  const sessionId = params?.id ? parseInt(params.id) : null;

  const { data: session } = useQuery<UserSession>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const { data: exam } = useQuery<Exam>({
    queryKey: [`/api/exams/${session?.examId}`],
    enabled: !!session?.examId,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions", session?.examId],
    queryFn: async () => {
      const response = await fetch(`/api/questions?examId=${session?.examId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!session?.examId,
  });

  // Fetch subject data for navigation
  const { data: subject } = useQuery({
    queryKey: [`/api/subjects/${exam?.subjectId}`],
    enabled: !!exam?.subjectId,
  });

  const calculateResults = (): ExamResult | null => {
    if (!session || !questions || !session.answers) return null;

    const correct = session.answers.reduce((count, answer, index) => {
      if (questions[index] && parseInt(answer) === questions[index].correctAnswer) {
        return count + 1;
      }
      return count;
    }, 0);

    const score = session.score || Math.round((correct / questions.length) * 100);
    const timeSpent = formatTime(session.timeSpent || 0);

    // Calculate domain performance for PMP-like exams
    const domainMap = new Map<string, { correct: number; total: number }>();
    
    questions.forEach((question, index) => {
      const domain = question.domain || 'General';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { correct: 0, total: 0 });
      }
      
      const domainData = domainMap.get(domain)!;
      domainData.total += 1;
      
      if (session.answers[index] && parseInt(session.answers[index]) === question.correctAnswer) {
        domainData.correct += 1;
      }
    });

    const domains: DomainResult[] = Array.from(domainMap.entries()).map(([name, data]) => ({
      name,
      score: Math.round((data.correct / data.total) * 100),
      percentage: (data.correct / data.total) * 100,
    }));

    return {
      score,
      correct,
      total: questions.length,
      timeSpent,
      domains,
    };
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const results = calculateResults();

  const handleReviewAnswers = () => {
    // Answer review feature planned for future release - current results provide comprehensive feedback
    console.log("Review answers not implemented yet");
  };

  const handleRetakeExam = () => {
    if (session?.examId) {
      setLocation(`/exam/${session.examId}`);
    }
  };

  const handleGoToExams = () => {
    if (subject?.slug) {
      setLocation(`/subject/${subject.slug}`);
    } else if (exam?.subjectId) {
      setLocation(`/subject/id/${exam.subjectId}`);
    } else {
      setLocation("/");
    }
  };

  if (!session || !results) {
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <i className="fas fa-trophy text-3xl text-green-600"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Completed!</h2>
          <p className="text-gray-600">Here's how you performed on {exam?.title}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{results.score}%</div>
              <p className="text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {results.correct}/{results.total}
              </div>
              <p className="text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-700 mb-2">{results.timeSpent}</div>
              <p className="text-gray-600">Time Spent</p>
            </div>
          </div>
          
          {results.domains.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Domain</h3>
              <div className="space-y-4">
                {results.domains.map((domain) => (
                  <div key={domain.name} className="flex items-center justify-between">
                    <span className="text-gray-700">{domain.name}</span>
                    <div className="flex items-center flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${
                            domain.score >= 80 ? 'bg-green-500' : 
                            domain.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${domain.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{domain.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-200">
            <button 
              onClick={handleReviewAnswers}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fas fa-eye mr-2"></i>Review Answers
            </button>
            <button 
              onClick={handleRetakeExam}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <i className="fas fa-redo mr-2"></i>Retake Exam
            </button>
            <button 
              onClick={handleGoToExams}
              className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <i className="fas fa-list mr-2"></i>Back to Exams
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
