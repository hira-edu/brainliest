import { TimerState } from "@/lib/types";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  timer: TimerState;
}

export default function ProgressBar({ currentQuestion, totalQuestions, timer }: ProgressBarProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-700">
            Time Remaining: <span className="text-primary">
              {timer.minutes}:{timer.seconds.toString().padStart(2, '0')}
            </span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
