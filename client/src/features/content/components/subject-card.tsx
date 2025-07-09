import { Subject } from "../../../../../shared/schema";
import { DynamicIcon } from "../../../utils/dynamic-icon";

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  // Use subject icon or fall back to default gradient icon

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg mb-4 transition-colors">
          <DynamicIcon 
            name={subject.icon} 
            className="w-12 h-12"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{subject.name}</h3>
        <p className="text-gray-600 mb-4">{subject.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{subject.examCount} Practice Exams</span>
          <span className="text-sm text-gray-500">{subject.questionCount}+ Questions</span>
        </div>
      </div>
    </div>
  );
}
