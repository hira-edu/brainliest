"use client"; // Fixed: RSC directive for Vercel compatibility

import { Exam } from "../../../../../shared/schema";

interface ExamCardProps {
  exam: Exam;
  onStart: () => void;
  lastScore?: number;
  isCompleted?: boolean;
}

// Fixed: Consolidated styling logic to reduce duplication
function getStatusStyles(hasNoQuestions: boolean, done: boolean) {
  if (hasNoQuestions) {
    return {
      statusText: "Unavailable",
      statusClasses: "px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full",
      buttonText: "Unavailable",
      buttonClasses: "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-gray-100 text-gray-400 cursor-not-allowed"
    };
  }
  
  if (done) {
    return {
      statusText: "Completed",
      statusClasses: "px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full",
      buttonText: "Retake Exam",
      buttonClasses: "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-gray-100 text-gray-700 group-hover:bg-gray-200"
    };
  }
  
  return {
    statusText: "New",
    statusClasses: "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full",
    buttonText: "Start Exam",
    buttonClasses: "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
  };
}

// Fixed: Validate score to ensure it's between 0-100
function validateScore(score: number | undefined): number | null {
  if (score == null) return null;
  
  if (score < 0 || score > 100) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Invalid exam score: ${score}. Expected 0-100.`);
    }
    return null;
  }
  
  return score;
}

// Fixed: Normalize difficulty display for consistency
function normalizeDifficulty(difficulty: string): string {
  if (!difficulty) return "Not specified";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}

export default function ExamCard({
  exam,
  onStart,
  lastScore,
  isCompleted,
}: ExamCardProps) {
  // Fixed: Enhanced field validation with fallbacks
  const done = Boolean(isCompleted);
  const scoreValue = validateScore(lastScore);
  const questionCount = exam.questionCount ?? 0;
  const duration = exam.duration ?? 0;
  const difficulty = exam.difficulty ?? "";
  
  // Fixed: Field validation for exam properties
  const examTitle = exam.title || "Untitled Exam";
  const examDescription = exam.description || "No description available";

  // Check if exam has no questions - critical for UX
  const hasNoQuestions = questionCount === 0;

  // Fixed: Enhanced difficulty mapping with unknown value logging
  const getDifficultyColor = (d: string) => {
    const normalizedDifficulty = d.toLowerCase();
    switch (normalizedDifficulty) {
      case "beginner":
        return "text-green-600";
      case "intermediate":
        return "text-orange-600";
      case "advanced":
      case "expert":
        return "text-red-600";
      default:
        if (process.env.NODE_ENV === 'development' && d) {
          console.warn(`Unknown difficulty level: ${d}`);
        }
        return "text-gray-600";
    }
  };
  const difficultyColorClass = getDifficultyColor(difficulty);

  // Fixed: Use consolidated styling function
  const { statusText, statusClasses, buttonText, buttonClasses } = getStatusStyles(hasNoQuestions, done);

  // Fixed: Combined event handlers to reduce duplication
  const handleAction = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (hasNoQuestions) return;
    
    try {
      onStart();
    } catch (error) {
      console.error('Error starting exam:', error);
    }
  };

  // Fixed: Modern keyboard event handler using onKeyDown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !hasNoQuestions) {
      e.preventDefault(); // Prevent default space scrolling
      handleAction(e);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md transition-all duration-300 group ${
        hasNoQuestions 
          ? "opacity-75 cursor-not-allowed" 
          : "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
      }`}
      onClick={handleAction}
      role="button"
      tabIndex={hasNoQuestions ? -1 : 0}
      onKeyDown={handleKeyDown} // Fixed: Use onKeyDown instead of deprecated onKeyPress
      aria-label={`${done ? 'Retake' : 'Start'} ${examTitle} exam`} // Fixed: Accessibility label
    >
      <div className="p-6">
        {/* Title & status */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {examTitle} {/* Fixed: Use validated title with fallback */}
          </h3>
          <span className={statusClasses}>{statusText}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 group-hover:text-gray-800 transition-colors">
          {examDescription} {/* Fixed: Use validated description with fallback */}
        </p>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Questions:</span>
            <span className={`font-medium ${hasNoQuestions ? 'text-gray-400' : ''}`}>
              {hasNoQuestions ? "No questions available" : `${questionCount} question${questionCount > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-medium">{duration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Difficulty:</span>
            <span className={`font-medium ${difficultyColorClass}`}>
              {normalizeDifficulty(difficulty)} {/* Fixed: Normalize difficulty display */}
            </span>
          </div>

          {/* Show lastScore even if it's 0 */}
          {scoreValue != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Last Score:</span>
              <span className="font-medium text-green-600">
                {scoreValue}%
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <button 
          className={buttonClasses}
          disabled={hasNoQuestions}
          onClick={hasNoQuestions ? undefined : handleAction}
          aria-label={hasNoQuestions ? 'Exam unavailable' : (done ? `Retake ${examTitle}` : `Start ${examTitle}`)} // Fixed: Accessibility label for button
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
