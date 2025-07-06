import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Question, UserSession, Exam } from "@shared/schema";
import { TimerState } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import ProgressBar from "@/components/progress-bar";
import QuestionCard from "@/components/question-card";
import FeedbackCard from "@/components/feedback-card";

export default function QuestionInterface() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/exam/:id");
  const examId = params?.id ? parseInt(params.id) : null;

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

  const { data: session } = useQuery<UserSession>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest("POST", "/api/sessions", { examId });
      return response.json();
    },
    onSuccess: (session: UserSession) => {
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
    mutationFn: async (data: { sessionId: number; updates: Partial<UserSession> }) => {
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

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
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
      setCurrentQuestionIndex(prev => prev + 1);
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
    session.answers?.forEach((answer, index) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <ProgressBar 
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions?.length || 0}
        timer={timer}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestionCard 
          question={currentQuestion}
          onAnswer={handleAnswer}
          onPrevious={handlePreviousQuestion}
          onSubmit={handleSubmitAnswer}
          selectedAnswer={selectedAnswer}
          canGoPrevious={currentQuestionIndex > 0}
        />
        
        {/* Slide-down feedback section */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showFeedback ? 'max-h-screen opacity-100 mt-6' : 'max-h-0 opacity-0'
        }`}>
          {showFeedback && (
            <FeedbackCard 
              question={currentQuestion}
              userAnswer={selectedAnswer!}
              onNext={handleNextQuestion}
              isLastQuestion={currentQuestionIndex === (questions?.length || 0) - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
