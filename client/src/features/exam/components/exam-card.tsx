import { Exam, Subject } from "@shared/schema";
import { Link } from "wouter";

interface ExamCardProps {
  exam: Exam;
  subject?: Subject;
  lastScore?: number;
  isCompleted?: boolean;
}

export default function ExamCard({ exam, subject, lastScore, isCompleted }: ExamCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-orange-600';
      case 'advanced': return 'text-red-600';
      case 'expert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const examUrl = subject?.slug && exam.slug ? `/exam/${subject.slug}/${exam.slug}` : `/exam/${exam.id}`;

  return (
    <Link href={examUrl}>
      <div 
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
      >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {exam.title}
          </h3>
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
        <p className="text-gray-600 mb-4 group-hover:text-gray-800 transition-colors">
          {exam.description}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Questions:</span>
            <span className="font-medium">{exam.questionCount}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Duration:</span>
            <span className="font-medium">{exam.duration} minutes</span>
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
        <div className={`w-full mt-4 py-2 px-4 rounded-lg text-center font-medium transition-colors ${
          isCompleted 
            ? 'bg-gray-100 text-gray-700 group-hover:bg-gray-200' 
            : 'bg-primary text-white group-hover:bg-blue-700'
        }`}>
          {isCompleted ? 'Retake Exam' : 'Start Exam'}
        </div>
      </div>
      </div>
    </Link>
  );
}
