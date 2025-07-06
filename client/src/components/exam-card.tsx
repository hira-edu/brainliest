import { Exam } from "@shared/schema";

interface ExamCardProps {
  exam: Exam;
  onStart: () => void;
  lastScore?: number;
  isCompleted?: boolean;
}

export default function ExamCard({ exam, onStart, lastScore, isCompleted }: ExamCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-orange-600';
      case 'advanced': return 'text-red-600';
      case 'expert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
          {isCompleted ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Completed
            </span>
          ) : (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-4">{exam.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Questions:</span>
            <span>{exam.questionCount}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Duration:</span>
            <span>{exam.duration} minutes</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Difficulty:</span>
            <span className={`font-medium ${getDifficultyColor(exam.difficulty)}`}>
              {exam.difficulty}
            </span>
          </div>
          {lastScore && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last Score:</span>
              <span className="font-medium text-green-600">{lastScore}%</span>
            </div>
          )}
        </div>
        <button 
          onClick={onStart}
          className={`w-full mt-4 py-2 px-4 rounded-lg transition-colors font-medium ${
            isCompleted 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-primary text-white hover:bg-blue-700'
          }`}
        >
          {isCompleted ? 'Retake Exam' : 'Start Exam'}
        </button>
      </div>
    </div>
  );
}
