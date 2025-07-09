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

  // Status badge
  const statusText = done ? "Completed" : "New";
  const statusClasses = done
    ? "px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
    : "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full";

  // Button at bottom
  const buttonText = done ? "Retake Exam" : "Start Exam";
  const buttonClasses = done
    ? "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-gray-100 text-gray-700 group-hover:bg-gray-200"
    : "w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors bg-primary text-white group-hover:bg-blue-700";

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") onStart();
      }}
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
            <span className="font-medium">{questionCount}</span>
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
        <div className={buttonClasses}>{buttonText}</div>
      </div>
    </div>
  );
}
