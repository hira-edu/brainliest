import { Exam } from "../../../../../shared/schema";

interface ExamCardProps {
  exam: Exam;
  onStart: () => void;
  lastScore?: number;
  isCompleted?: boolean;
}

export default function ExamCard({
  exam,
  onStart,
  lastScore,
  isCompleted,
}: ExamCardProps) {
  // Normalize optional props & exam fields
  const done = Boolean(isCompleted);
  const scoreValue = lastScore != null ? lastScore : null;
  const questionCount = exam.questionCount ?? 0;
  const duration = exam.duration ?? 0;
  const difficulty = exam.difficulty ?? "";

  // Check if exam has no questions - critical for UX
  const hasNoQuestions = questionCount === 0;

  // Map difficulty to a consistent color class
  const getDifficultyColor = (d: string) => {
    switch (d.toLowerCase()) {
      case "beginner":
        return "text-green-600";
      case "intermediate":
        return "text-orange-600";
      case "advanced":
      case "expert":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  const difficultyColorClass = getDifficultyColor(difficulty);

  // Status badge - show "Unavailable" for empty exams
  const statusText = hasNoQuestions ? "Unavailable" : done ? "Completed" : "New";
  const statusClasses = hasNoQuestions
    ? "px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
    : done
    ? "px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
    : "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full";

  // Button at bottom - disable for empty exams
  const buttonText = hasNoQuestions ? "Unavailable" : done ? "Retake Exam" : "Start Exam";
  const buttonClasses = hasNoQuestions
    ? "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-gray-100 text-gray-400 cursor-not-allowed"
    : done
    ? "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-gray-100 text-gray-700 group-hover:bg-gray-200"
    : "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-primary text-white group-hover:bg-blue-700";

  // Handle click - prevent navigation for empty exams
  const handleClick = () => {
    if (!hasNoQuestions) {
      onStart();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !hasNoQuestions) {
      onStart();
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md transition-all duration-300 group ${
        hasNoQuestions 
          ? "opacity-75 cursor-not-allowed" 
          : "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={hasNoQuestions ? -1 : 0}
      onKeyPress={handleKeyPress}
    >
      <div className="p-6">
        {/* Title & status */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {exam.title}
          </h3>
          <span className={statusClasses}>{statusText}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 group-hover:text-gray-800 transition-colors">
          {exam.description}
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
              {exam.difficulty}
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
          onClick={hasNoQuestions ? undefined : handleClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
