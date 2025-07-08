import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Question, ExamSession, Exam, Subject } from "@shared/schema";
import { TimerState } from "../../../shared/types";
import { apiRequest, queryClient } from "../../../services/queryClient";
import { useAuth } from "../../auth/AuthContext";
import { useQuestionLimit } from "../../shared/QuestionLimitContext";
import { Header } from "../../shared";
import ProgressBar from "../components/progress-bar";
import QuestionCard from "../components/question-card";
import FeedbackCard from "../components/feedback-card";
import UnifiedAuthModal from "../../auth/unified-auth-modal";
import { SEOHead } from "../../shared";
import DynamicFAQ from "../../shared/components/dynamic-faq";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuestionInterface() {
  const [, setLocation] = useLocation();

  // Routing: prefer slug, fallback to ID
  const [slugMatch, slugParams] = useRoute("/exam/:slug");
  const [idMatch, idParams] = useRoute("/exam/id/:id");
  const isSlugRoute = slugMatch && !!slugParams?.slug;
  const isIdRoute = idMatch && !!idParams?.id;
  const examSlug = isSlugRoute ? slugParams.slug : null;
  const examId = isIdRoute ? parseInt(idParams.id, 10) : null;

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Fetch exam
  const {
    data: exam,
    isLoading: isExamLoading
  } = useQuery<Exam>({
    queryKey: ["exam", isSlugRoute ? examSlug : examId],
    queryFn: async () => {
      const url = isSlugRoute
        ? `/api/exams/by-slug/${examSlug}`
        : `/api/exams/${examId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
    enabled: !!(examSlug || examId)
  });

  // Fetch subject
  const {
    data: subject,
    isLoading: isSubjectLoading
  } = useQuery<Subject>({
    queryKey: ["subject", exam?.subjectSlug, exam?.subjectId],
    queryFn: async () => {
      const url = exam?.subjectSlug
        ? `/api/subjects/by-slug/${exam.subjectSlug}`
        : `/api/subjects/${exam.subjectId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch subject");
      return res.json();
    },
    enabled: !!(exam?.subjectSlug || exam?.subjectId)
  });

  // Fetch questions
  const {
    data: questionsData,
    isLoading: isQuestionsLoading
  } = useQuery<{ questions: Question[]; freemiumSession?: any }>({
    queryKey: ["questions", isSlugRoute ? examSlug : examId],
    queryFn: async () => {
      const url = isSlugRoute
        ? `/api/questions?examSlug=${examSlug}`
        : `/api/questions?examId=${examId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!(examSlug || examId)
  });

  const questions = questionsData?.questions || [];

  // Fetch or create session
  const {
    data: session,
    isLoading: isSessionLoading
  } = useQuery<ExamSession>({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId
  });

  const createSessionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", "/api/sessions", { examId: id }),
    onSuccess: (newSession: ExamSession) => {
      setSessionId(newSession.id);
      if (exam?.duration) {
        setTimer({
          minutes: exam.duration,
          seconds: 0,
          totalSeconds: exam.duration * 60
        });
      }
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: (data: { sessionId: number; updates: Partial<ExamSession> }) =>
      apiRequest("PUT", `/api/sessions/${data.sessionId}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    }
  });

  // Start or fetch session when exam loads
  useEffect(() => {
    if (exam?.id && !sessionId) {
      createSessionMutation.mutate(exam.id);
    }
  }, [exam?.id, sessionId]);

  // Unified finish handler
  const handleFinishExam = useCallback(() => {
    if (!sessionId || !session) return;

    // Calculate score and timeSpent locally
    let correctCount = 0;
    session.answers?.forEach((ans, idx) => {
      const q = questions[idx];
      if (q && parseInt(ans) === q.correctAnswer) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / questions.length) * 100);
    const timeSpent = (exam?.duration || 60) * 60 - timer.totalSeconds;

    updateSessionMutation.mutate({
      sessionId,
      updates: {
        isCompleted: true,
        completedAt: new Date().toISOString(),
        score,
        timeSpent
      }
    });

    setLocation(`/results/${sessionId}`);
  }, [sessionId, session, questions, exam?.duration, timer.totalSeconds]);

  // Timer countdown
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timer.totalSeconds > 0 && sessionId && !showFeedback && isActiveRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (!isActiveRef.current) return prev;
          const newTotal = prev.totalSeconds - 1;
          if (newTotal <= 0) {
            clearInterval(timerRef.current!);
            handleFinishExam();
            return prev;
          }
          return {
            minutes: Math.floor(newTotal / 60),
            seconds: newTotal % 60,
            totalSeconds: newTotal
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer.totalSeconds, sessionId, showFeedback, handleFinishExam]);

  // Cleanup on unmount
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

  const currentQuestion = questions[currentQuestionIndex];

  // Track free-preview views
  useEffect(() => {
    if (!isSignedIn && currentQuestion && !isQuestionViewed(currentQuestion.id)) {
      if (canViewMoreQuestions) {
        addViewedQuestion(currentQuestion.id);
      }
    }
  }, [
    currentQuestion,
    isSignedIn,
    canViewMoreQuestions,
    addViewedQuestion,
    isQuestionViewed
  ]);

  const remaining = getRemainingQuestions();
  const shouldBlurQuestion =
    !isSignedIn &&
    currentQuestion &&
    !isQuestionViewed(currentQuestion.id) &&
    !canViewMoreQuestions;

  const handleAnswer = (idx: number) => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }
    if (selectedAnswer == null) {
      return;
    }

    // Show feedback immediately for better UX
    setShowFeedback(true);

    // Update session if we have one
    if (sessionId && session) {
      const updatedAnswers = [...(session?.answers || [])];
      updatedAnswers[currentQuestionIndex] = selectedAnswer.toString();

      updateSessionMutation.mutate({
        sessionId,
        updates: { answers: updatedAnswers, currentQuestionIndex }
      });
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(undefined);

    if (currentQuestionIndex < questions.length - 1) {
      const next = currentQuestionIndex + 1;
      setCurrentQuestionIndex(next);

      const prevAns = session?.answers?.[next];
      setSelectedAnswer(prevAns ? parseInt(prevAns) : undefined);

      // If next question is over preview limit, prompt sign-in
      if (
        !isSignedIn &&
        questions[next] &&
        !isQuestionViewed(questions[next].id) &&
        !canViewMoreQuestions
      ) {
        setShowAuthModal(true);
      }
    } else {
      handleFinishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prev = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prev);
      setShowFeedback(false);

      const prevAns = session?.answers?.[prev];
      setSelectedAnswer(prevAns ? parseInt(prevAns) : undefined);
    }
  };

  // Consolidated loading state
  if (isExamLoading || isSubjectLoading || isQuestionsLoading || !questionsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {/* ...loading UI identical to original... */}
      </div>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {/* ...“No Questions Available” UI identical to original... */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentQuestion && (
        <SEOHead
          title={`${currentQuestion.text.slice(0, 60)}... | ${exam?.title}`}
          description={`${currentQuestion.text.slice(0, 120)}...`}
          type="question"
          keywords={[exam?.title || "", "practice", "exam prep"]}
        />
      )}
      <Header />

      {/* Exam Header */}
      {exam && subject && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLocation(
                    subject.slug
                      ? `/subject/${subject.slug}`
                      : `/subject/id/${exam.subjectId}`
                  )
                }
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">{exam.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="text-xs text-gray-500">
                {exam.duration} minutes • {exam.difficulty}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProgressBar
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timer={timer}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!isSignedIn && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between">
            <span className="text-blue-700 text-sm">
              Free Preview: {remaining} questions remaining
            </span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Sign in for unlimited →
            </button>
          </div>
        )}

        <div className={shouldBlurQuestion ? "pointer-events-none relative" : "relative"}>
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            onPrevious={handlePreviousQuestion}
            onSubmit={handleSubmitAnswer}
            selectedAnswer={selectedAnswer}
            canGoPrevious={currentQuestionIndex > 0}
          />

          {shouldBlurQuestion && (
            <div className="absolute inset-0 bg-gray-100/95 rounded-lg flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2">Sign in to continue</h3>
                <p className="text-gray-600 mb-4">
                  You've used up your free preview. Sign in to continue practicing.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showFeedback ? "max-h-screen opacity-100 mt-6" : "max-h-0 opacity-0"
          }`}
        >
          {showFeedback && !shouldBlurQuestion && (
            <FeedbackCard
              question={currentQuestion}
              userAnswer={selectedAnswer!}
              onNext={handleNextQuestion}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
            />
          )}
        </div>

        {showFeedback && currentQuestion && (
          <div className="mt-8">
            <DynamicFAQ
              questionText={currentQuestion.text}
              options={currentQuestion.options}
              explanation={currentQuestion.explanation}
              subject={exam?.title}
              category="exam preparation"
              className="bg-white rounded-lg shadow-sm p-6"
            />
          </div>
        )}
      </div>

      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="freemium"
        title="Unlock Unlimited Questions"
        description={`You've viewed ${20 - remaining} free questions. Sign in to continue.`}
      />
    </div>
  );
}
