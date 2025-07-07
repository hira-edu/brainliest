import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Question, ExamSession, Exam } from "@shared/schema";
import { TimerState } from "../../../shared/types";
import { apiRequest, queryClient } from "../../../services/queryClient";
import { useAuth } from "../../auth/AuthContext";
import { useQuestionLimit } from "../../shared/QuestionLimitContext";
import { Header } from "../../shared";
import ProgressBar from "../components/progress-bar";
import QuestionCard from "../components/question-card";
import FeedbackCard from "../components/feedback-card";
import UnifiedAuthModal from "../../auth/components/unified-auth-modal";
import { SEOHead } from "../../shared";
import DynamicFAQ from "../../shared/components/dynamic-faq";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuestionInterface() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/exam/:id");
  const examId = params?.id ? parseInt(params.id) : null;

  const { isSignedIn } = useAuth();
  const { 
    canViewMoreQuestions, 
    addViewedQuestion, 
    isQuestionViewed, 
    showAuthModal, 
    setShowAuthModal,
    getRemainingQuestions
  } = useQuestionLimit();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [timer, setTimer] = useState<TimerState>({ minutes: 60, seconds: 0, totalSeconds: 3600 });
  
  // PERFORMANCE FIX: Use refs to prevent stale closure issues in timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const { data: exam } = useQuery<Exam>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", examId],
    queryFn: async () => {
      const response = await fetch(`/api/questions?examId=${examId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!examId,
  });

  const { data: session } = useQuery<ExamSession>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest("POST", "/api/sessions", { examId });
      return response.json();
    },
    onSuccess: (session: ExamSession) => {
      setSessionId(session.id);
      if (exam?.duration) {
        setTimer({
          minutes: exam.duration,
          seconds: 0,
          totalSeconds: exam.duration * 60,
        });
      }
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: number; updates: Partial<ExamSession> }) => {
      const response = await apiRequest("PUT", `/api/sessions/${data.sessionId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
    },
  });

  // Initialize session when exam loads
  useEffect(() => {
    if (examId && !sessionId) {
      createSessionMutation.mutate(examId);
    }
  }, [examId, sessionId]);

  // PERFORMANCE OPTIMIZED: Timer countdown with proper cleanup
  const handleFinishExamCallback = useCallback(() => {
    if (sessionId && questions && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      updateSessionMutation.mutate({
        sessionId,
        updates: {
          completed: true,
          endTime: new Date().toISOString(),
          score: `${Math.round((session?.score || 0) * 100)}%`,
        },
      });
      setLocation("/results");
    }
  }, [sessionId, questions, currentQuestionIndex, session?.score, updateSessionMutation, setLocation]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timer.totalSeconds > 0 && sessionId && !showFeedback && isActiveRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (!isActiveRef.current) return prev;
          
          const newTotalSeconds = prev.totalSeconds - 1;
          const minutes = Math.floor(newTotalSeconds / 60);
          const seconds = newTotalSeconds % 60;
          
          if (newTotalSeconds <= 0) {
            // Time's up - finish exam
            handleFinishExamCallback();
            return prev;
          }
          
          return {
            minutes,
            seconds,
            totalSeconds: newTotalSeconds,
          };
        });
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer.totalSeconds, sessionId, showFeedback, handleFinishExamCallback]);

  // PERFORMANCE FIX: Cleanup on component unmount
  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const currentQuestion = questions?.[currentQuestionIndex];
  
  // Track question views for non-authenticated users
  useEffect(() => {
    if (!isSignedIn && currentQuestion && !isQuestionViewed(currentQuestion.id)) {
      // Check if user can view more questions before tracking
      if (canViewMoreQuestions) {
        addViewedQuestion(currentQuestion.id);
      }
    }
  }, [currentQuestion?.id, isSignedIn, canViewMoreQuestions, addViewedQuestion, isQuestionViewed]);
  
  // Check if current question should be blurred for non-authenticated users
  const shouldBlurQuestion = !isSignedIn && currentQuestion && !isQuestionViewed(currentQuestion.id) && !canViewMoreQuestions;

  const handleAnswer = (answerIndex: number) => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }
    if (selectedAnswer === undefined || !sessionId || !session) return;
    
    const newAnswers = [...(session.answers || [])];
    newAnswers[currentQuestionIndex] = selectedAnswer.toString();
    
    updateSessionMutation.mutate({
      sessionId,
      updates: {
        currentQuestionIndex,
        answers: newAnswers,
      },
    });

    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(undefined);
    
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      
      const nextQuestion = questions?.[nextQuestionIndex];
      
      // Check if the next question can be viewed
      if (!isSignedIn && nextQuestion && !isQuestionViewed(nextQuestion.id) && !canViewMoreQuestions) {
        setShowAuthModal(true);
        return;
      }
      
      // Clear any previous answers for the new question to ensure fresh state
      const prevAnswer = session?.answers?.[nextQuestionIndex];
      setSelectedAnswer(prevAnswer ? parseInt(prevAnswer) : undefined);
    } else {
      handleFinishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowFeedback(false);
      // Load previous answer if exists
      const prevAnswer = session?.answers?.[currentQuestionIndex - 1];
      setSelectedAnswer(prevAnswer ? parseInt(prevAnswer) : undefined);
    }
  };

  const handleFinishExam = () => {
    if (!sessionId || !session || !questions) return;
    
    // Calculate score
    let correctAnswers = 0;
    session.answers?.forEach((answer: string, index: number) => {
      if (questions[index] && parseInt(answer) === questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = (exam?.duration || 60) * 60 - timer.totalSeconds;

    updateSessionMutation.mutate({
      sessionId,
      updates: {
        isCompleted: true,
        score,
        timeSpent,
        completedAt: new Date(),
      },
    });

    setLocation(`/results/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Exam Header with Back Button - Same as when questions exist */}
        {exam && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(`/subject/${exam.subjectId}`)}
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
                <div className="text-right">
                  <div className="text-sm text-gray-600">No questions available</div>
                  <div className="text-xs text-gray-500">{exam.duration} minutes • {exam.difficulty}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ProgressBar 
          currentQuestion={0}
          totalQuestions={0}
          timer={timer}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Same card structure as QuestionCard */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-question-circle text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Available</h3>
              <p className="text-gray-600 mb-6">
                This exam doesn't have any questions yet. Please check back later or contact support.
              </p>
              <Button 
                onClick={() => setLocation(`/subject/${exam?.subjectId}`)}
                variant="default"
                className="px-6 py-2"
              >
                Back to Exams
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Head for question pages */}
      {currentQuestion && (
        <SEOHead
          title={`${currentQuestion.text.substring(0, 60)}... | ${exam?.title || 'Practice Exam'}`}
          description={`Practice question from ${exam?.title || 'exam'}: ${currentQuestion.text.substring(0, 120)}...`}
          type="question"
          keywords={[exam?.title || '', 'practice questions', 'exam preparation', 'study guide']}
        />
      )}
      
      <Header />
      
      {/* Exam Header with Back Button */}
      {exam && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(`/subject/${exam.subjectId}`)}
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
              <div className="text-right">
                <div className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions?.length || 0}</div>
                <div className="text-xs text-gray-500">{exam.duration} minutes • {exam.difficulty}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ProgressBar 
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions?.length || 0}
        timer={timer}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {!isSignedIn && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 text-sm">
                Free Preview: {getRemainingQuestions()} questions remaining
              </span>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Sign in for unlimited access →
              </button>
            </div>
          </div>
        )}

        <div className={`relative ${shouldBlurQuestion ? 'pointer-events-none' : ''}`}>
          <QuestionCard 
            question={currentQuestion}
            onAnswer={handleAnswer}
            onPrevious={handlePreviousQuestion}
            onSubmit={handleSubmitAnswer}
            selectedAnswer={selectedAnswer}
            canGoPrevious={currentQuestionIndex > 0}
          />
          
          {/* Blur overlay for non-authenticated users who hit the limit */}
          {shouldBlurQuestion && (
            <div className="absolute inset-0 backdrop-blur-sm bg-white/10 rounded-lg flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2">Sign in to continue</h3>
                <p className="text-gray-600 mb-4">
                  You've viewed your 20 free questions. Sign in to access unlimited questions and track your progress.
                </p>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Slide-down feedback section */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showFeedback ? 'max-h-screen opacity-100 mt-6' : 'max-h-0 opacity-0'
        }`}>
          {showFeedback && !shouldBlurQuestion && (
            <FeedbackCard 
              question={currentQuestion}
              userAnswer={selectedAnswer!}
              onNext={handleNextQuestion}
              isLastQuestion={currentQuestionIndex === (questions?.length || 0) - 1}
            />
          )}
        </div>

        {/* Dynamic FAQ Section */}
        {showFeedback && currentQuestion && (
          <div className="mt-8">
            <DynamicFAQ
              questionText={currentQuestion.text}
              options={currentQuestion.options}
              explanation={currentQuestion.explanation || undefined}
              subject={exam?.title || undefined}
              category="exam preparation"
              className="bg-white rounded-lg shadow-sm p-6"
            />
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <UnifiedAuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="freemium"
        title="Unlock Unlimited Questions"
        description={`You've viewed ${20 - getRemainingQuestions()} of 20 free questions. Sign in to continue practicing with unlimited access.`}
      />
    </div>
  );
}
