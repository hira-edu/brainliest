import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { UserSession, Question, Exam, Subject } from "@shared/schema";
import { Header } from "../../shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
// QuestionHelp component will be implemented later
// import { useAuthContext } from "../../auth";
import { UnifiedAuthModal } from "../../auth/components/unified-auth-modal";
import { toast } from "@/hooks/use-toast";
// import { useFreemiumStatus } from "@/hooks/use-freemium-status";

interface HierarchicalQuestionInterfaceProps {
  subjectSlug: string;
  examSlug: string;
  questionId?: string;
}

export default function HierarchicalQuestionInterface({ 
  subjectSlug, 
  examSlug, 
  questionId 
}: HierarchicalQuestionInterfaceProps) {
  const [, setLocation] = useLocation();
  // const { user } = useAuthContext(); // Simplified for now
  const user = null;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect', explanation: string } | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authTitle, setAuthTitle] = useState("Sign In Required");
  const [authMessage, setAuthMessage] = useState("Please sign in to access unlimited questions and track your progress.");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // const { freemiumStatus, isLoading: freemiumLoading } = useFreemiumStatus();

  // Fetch subject by slug
  const { data: subject, isLoading: subjectLoading } = useQuery<Subject>({
    queryKey: [`/api/subjects/slug/${subjectSlug}`],
    enabled: !!subjectSlug,
  });

  // Fetch exam by slug
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/slug/${examSlug}`],
    enabled: !!examSlug,
  });

  // Fetch questions using hierarchical API
  const { data: questionsData, isLoading: questionsLoading } = useQuery<{questions: Question[]}>({
    queryKey: [`/api/subject/${subjectSlug}/exam/${examSlug}/questions`],
    enabled: !!subjectSlug && !!examSlug,
  });

  const questions = questionsData?.questions;

  // Set current question index based on questionId parameter
  useEffect(() => {
    if (questions && questionId) {
      const index = questions.findIndex(q => q.id.toString() === questionId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [questions, questionId]);

  // Timer effect
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const currentQuestion = useMemo(() => 
    questions?.[currentQuestionIndex] || null, 
    [questions, currentQuestionIndex]
  );

  const handleAnswerSelect = useCallback((answerIndex: string) => {
    if (currentQuestion?.allowMultipleAnswers) {
      setSelectedAnswers(prev => 
        prev.includes(answerIndex) 
          ? prev.filter(a => a !== answerIndex)
          : [...prev, answerIndex]
      );
    } else {
      setSelectedAnswers([answerIndex]);
    }
  }, [currentQuestion?.allowMultipleAnswers]);

  const checkAnswer = useCallback(async () => {
    if (!currentQuestion || selectedAnswers.length === 0) return;

    // Check freemium limit for unauthenticated users (simplified for now)
    if (!user && currentQuestionIndex >= 20) {
      setAuthTitle("Question Limit Reached");
      setAuthMessage("You've reached the 20 question limit. Sign in to access unlimited questions and track your progress.");
      setShowAuth(true);
      return;
    }

    const isCorrect = currentQuestion.allowMultipleAnswers
      ? selectedAnswers.sort().join(',') === (currentQuestion.correctAnswers?.sort().join(',') || '')
      : parseInt(selectedAnswers[0]) === currentQuestion.correctAnswer;

    setFeedback({
      type: isCorrect ? 'correct' : 'incorrect',
      explanation: currentQuestion.explanation || 'No explanation available.'
    });

    // Record question view for freemium tracking
    if (!user) {
      try {
        await fetch('/api/freemium/record-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: currentQuestion.id })
        });
      } catch (error) {
        console.error('Failed to record question view:', error);
      }
    }
  }, [currentQuestion, selectedAnswers, user, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    if (!questions || currentQuestionIndex >= questions.length - 1) {
      // Navigate to results using hierarchical route
      setLocation(`/subject/${subjectSlug}/exam/${examSlug}/results/completed`);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswers([]);
    setFeedback(null);
    
    // Update URL to reflect current question
    if (questions[nextIndex]) {
      setLocation(`/subject/${subjectSlug}/exam/${examSlug}/question/${questions[nextIndex].id}`);
    }
  }, [questions, currentQuestionIndex, subjectSlug, examSlug, setLocation]);

  const handleBackToExams = useCallback(() => {
    setLocation(`/subject/${subjectSlug}`);
  }, [subjectSlug, setLocation]);

  if (subjectLoading || examLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading exam...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subject || !exam || !questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h2>
            <p className="text-gray-600 mb-6">The requested content could not be found.</p>
            <Button onClick={() => setLocation('/subjects')}>
              Browse Subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToExams}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">{exam.description}</p>
              </div>
            </div>
            
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
              <p className="text-gray-600 mb-6">This exam doesn't have any questions yet.</p>
              <Button onClick={handleBackToExams}>
                Back to Exams
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading question...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header with back button and exam info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToExams}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">{exam.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeElapsed)}
              </div>
              <div className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {currentQuestion.text}
                </h2>
                
                {/* Question options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index.toString())}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswers.includes(index.toString())
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="font-medium text-gray-600 mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* AI Help Panel - To be implemented */}
              {/* <div className="ml-8 w-80">
                <QuestionHelp 
                  question={currentQuestion.text}
                  options={currentQuestion.options || []}
                  subject={subject.name}
                />
              </div> */}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mb-8 p-6 rounded-lg ${
              feedback.type === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {feedback.type === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`font-medium ${
                    feedback.type === 'correct' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {feedback.type === 'correct' ? 'Correct!' : 'Incorrect'}
                  </h4>
                  <p className={`mt-1 ${
                    feedback.type === 'correct' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {feedback.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between">
            <div></div>
            <div className="space-x-4">
              {!feedback ? (
                <Button 
                  onClick={checkAnswer}
                  disabled={selectedAnswers.length === 0}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={nextQuestion}>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <UnifiedAuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          title={authTitle}
          message={authMessage}
        />
      )}
    </div>
  );
}