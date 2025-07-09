import { useState, useEffect, useCallback, useMemo } from "react";
import { Question, ExamSession } from "../../../../../shared/schema";
import { useAuth } from "../../auth/AuthContext";
import { useQuestionLimit } from "../../shared/QuestionLimitContext";

interface UseQuestionNavigationProps {
  questions: Question[];
  session: ExamSession | null;
  updateSession: (updates: Partial<ExamSession>) => Promise<void>;
  onFinishExam: () => void;
}

interface QuestionNavigationState {
  currentQuestionIndex: number;
  currentQuestion: Question | undefined;
  selectedAnswer: number | undefined;
  showFeedback: boolean;
  shouldBlurQuestion: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  handleAnswer: (answerIndex: number) => void;
  handleSubmitAnswer: () => Promise<void>;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  goToQuestion: (index: number) => void;
}

export function useQuestionNavigation({
  questions,
  session,
  updateSession,
  onFinishExam
}: UseQuestionNavigationProps): QuestionNavigationState {
  const { isSignedIn } = useAuth();
  const {
    canViewMoreQuestions,
    addViewedQuestion,
    isQuestionViewed,
    showAuthModal,
    setShowAuthModal
  } = useQuestionLimit();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Memoized preview check to avoid recalculations
  const shouldBlurQuestion = useMemo(() => {
    return !isSignedIn &&
           currentQuestion &&
           !isQuestionViewed(currentQuestion.id) &&
           !canViewMoreQuestions;
  }, [isSignedIn, currentQuestion, isQuestionViewed, canViewMoreQuestions]);

  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < questions.length - 1;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Track free-preview views with proper dependency array
  useEffect(() => {
    if (!isSignedIn && currentQuestion && !isQuestionViewed(currentQuestion.id)) {
      if (canViewMoreQuestions) {
        addViewedQuestion(currentQuestion.id);
      }
    }
  }, [currentQuestion?.id, isSignedIn, canViewMoreQuestions, addViewedQuestion, isQuestionViewed]);

  // Restore answer from session when question changes
  useEffect(() => {
    if (session?.answers?.[currentQuestionIndex]) {
      const savedAnswer = session.answers[currentQuestionIndex];
      setSelectedAnswer(parseInt(savedAnswer));
    } else {
      setSelectedAnswer(undefined);
    }
    setShowFeedback(false);
  }, [currentQuestionIndex, session?.answers]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAnswer(answerIndex);
  }, [shouldBlurQuestion, setShowAuthModal]);

  const handleSubmitAnswer = useCallback(async () => {
    if (shouldBlurQuestion) {
      setShowAuthModal(true);
      return;
    }

    if (selectedAnswer == null) {
      return;
    }

    try {
      // Update session with new answer
      if (session) {
        const updatedAnswers = [...(session.answers || [])];
        updatedAnswers[currentQuestionIndex] = selectedAnswer.toString();

        await updateSession({
          answers: updatedAnswers,
          currentQuestionIndex
        });
      }

      // Show feedback after successful save
      setShowFeedback(true);
    } catch (error) {
      console.error("Failed to save answer:", error);
      // Show user-friendly error
      alert("Failed to save your answer. Please try again.");
    }
  }, [shouldBlurQuestion, selectedAnswer, session, currentQuestionIndex, updateSession, setShowAuthModal]);

  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false);
    
    if (canGoNext) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Check if next question should be blurred
      const nextQuestion = questions[nextIndex];
      if (!isSignedIn && 
          nextQuestion && 
          !isQuestionViewed(nextQuestion.id) && 
          !canViewMoreQuestions) {
        setShowAuthModal(true);
      }
    } else {
      onFinishExam();
    }
  }, [canGoNext, currentQuestionIndex, questions, isSignedIn, isQuestionViewed, canViewMoreQuestions, onFinishExam, setShowAuthModal]);

  const handlePreviousQuestion = useCallback(() => {
    if (canGoPrevious) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowFeedback(false);
    }
  }, [canGoPrevious, currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setShowFeedback(false);
      
      // Check preview limits for the target question
      const targetQuestion = questions[index];
      if (!isSignedIn && 
          targetQuestion && 
          !isQuestionViewed(targetQuestion.id) && 
          !canViewMoreQuestions) {
        setShowAuthModal(true);
      }
    }
  }, [questions.length, isSignedIn, isQuestionViewed, canViewMoreQuestions, setShowAuthModal]);

  return {
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    showFeedback,
    shouldBlurQuestion,
    canGoPrevious,
    canGoNext,
    isLastQuestion,
    showAuthModal,
    setShowAuthModal,
    handleAnswer,
    handleSubmitAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    goToQuestion
  };
}