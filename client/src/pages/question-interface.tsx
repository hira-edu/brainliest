import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Question, ExamSession, Exam } from "@shared/schema";
import { TimerState } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useQuestionLimit } from "@/contexts/QuestionLimitContext";
import Header from "@/components/header";
import ProgressBar from "@/components/progress-bar";
import QuestionCard from "@/components/question-card";
import FeedbackCard from "@/components/feedback-card";
import UnifiedAuthModal from "@/components/unified-auth-modal";
import SEOHead from "@/components/seo-head";
import DynamicFAQ from "@/components/dynamic-faq";

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

  // Timer countdown
  useEffect(() => {
    if (timer.totalSeconds > 0 && sessionId && !showFeedback) {
      const interval = setInterval(() => {
        setTimer(prev => {
          const newTotalSeconds = prev.totalSeconds - 1;
          const minutes = Math.floor(newTotalSeconds / 60);
          const seconds = newTotalSeconds % 60;
          
          if (newTotalSeconds <= 0) {
            // Time's up - finish exam
            handleFinishExam();
            return prev;
          }
          
          return {
            minutes,
            seconds,
            totalSeconds: newTotalSeconds,
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer.totalSeconds, sessionId, showFeedback]);

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
      const nextQuestion = questions?.[nextQuestionIndex];
      
      // Check if the next question can be viewed
      if (!isSignedIn && nextQuestion && !isQuestionViewed(nextQuestion.id) && !canViewMoreQuestions) {
        setShowAuthModal(true);
        return;
      }
      
      setCurrentQuestionIndex(nextQuestionIndex);
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">No questions found for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = currentQuestion ? {
    id: currentQuestion.id,
    text: currentQuestion.text,
    options: currentQuestion.options,
    correctAnswer: currentQuestion.correctAnswer,
    explanation: currentQuestion.explanation,
    subject: exam?.title || '',
    url: window.location.href
  } : null;

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
