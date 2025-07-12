 // RSC directive for client-side exam interface and real-time interactions

import { useRoute, useLocation } from "wouter";
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
import { Button } from "../../../components/ui/button";
import { useExamLoader } from "../hooks/useExamLoader";
import { useExamSession } from "../hooks/useExamSession";
import { useQuestionNavigation } from "../hooks/useQuestionNavigation";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingState } from "./LoadingState";

export default function QuestionInterface() {
  // Routing: prefer slug, fallback to ID with proper validation
  const [slugMatch, slugParams] = useRoute("/exam/:slug");
  const [idMatch, idParams] = useRoute("/exam/id/:id");
  
  const slugOrId = slugMatch && slugParams?.slug 
    ? slugParams.slug 
    : idMatch && idParams?.id 
    ? parseInt(idParams.id, 10) 
    : null;

  // Industrial-grade data loading with error handling
  const { exam, subject, questions, isLoading, isError, error, refetch } = useExamLoader(slugOrId);

  // Session management with proper error handling
  const {
    sessionId,
    session,
    timer,
    isCreatingSession,
    sessionError,
    updateSession,
    finishExam
  } = useExamSession({ exam, questions });

  // Question navigation with preview limits
  const {
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    showFeedback,
    shouldBlurQuestion,
    canGoPrevious,
    isLastQuestion,
    showAuthModal,
    setShowAuthModal,
    handleAnswer,
    handleSubmitAnswer,
    handleNextQuestion,
    handlePreviousQuestion
  } = useQuestionNavigation({
    questions,
    session,
    updateSession,
    onFinishExam: finishExam
  });

  const { isSignedIn } = useAuth();
  const { getRemainingQuestions } = useQuestionLimit();

  // Session management is now handled by useExamSession hook

  const remaining = getRemainingQuestions();
  const [, setLocation] = useLocation();

  // Error handling with user-friendly interface
  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load exam"
        message={error?.message || "We couldn't load this exam. Please check your connection and try again."}
        onRetry={refetch}
      />
    );
  }

  // Loading state with proper messaging
  if (isLoading) {
    return <LoadingState message="Loading exam content..." />;
  }

  // Session creation error handling
  if (sessionError) {
    return (
      <ErrorMessage
        title="Session Error"
        message="Failed to start your exam session. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Enhanced loading state with proper feedback
  if (isLoading || isCreatingSession) {
    return <LoadingState message={isCreatingSession ? "Starting your exam session..." : "Loading exam content..."} />;
  }

  // Industrial-grade empty state protection - prevent users from starting empty exams
  if (exam && questions.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-6">
            This exam doesn't have any questions yet. Please check back later or contact support if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => setLocation(`/subject/${exam.subjectSlug}`)}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to {subject?.name || 'Subject'} Exams
            </button>
            <button 
              onClick={() => setLocation("/")}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Browse All Subjects
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {/* Enhanced empty state with same design as normal interface */}
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
                        : `/subject/${exam.subjectSlug || 'unknown'}`
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
                  No questions available
                </div>
                <div className="text-xs text-gray-500">
                  {exam.duration} minutes • {exam.difficulty}
                </div>
              </div>
            </div>
          </div>
        )}
        <ProgressBar currentQuestion={0} totalQuestions={0} timer={timer} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Questions Available</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This exam doesn't have any questions yet. Our content team is working on adding practice questions for this certification.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              We're constantly expanding our question bank to provide comprehensive preparation materials.
            </p>
            <Button
              onClick={() =>
                setLocation(
                  subject?.slug
                    ? `/subject/${subject.slug}`
                    : `/subject/id/${exam?.subjectId}`
                )
              }
              className="bg-primary text-white hover:bg-blue-700 px-6 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Other Exams
            </Button>
          </div>
        </div>
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
                    subject?.slug
                      ? `/subject/${subject.slug}`
                      : `/subject/id/${exam?.subjectId}`
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
            canGoPrevious={canGoPrevious}
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
              isLastQuestion={isLastQuestion}
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
