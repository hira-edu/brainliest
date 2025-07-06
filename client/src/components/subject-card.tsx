import { Subject } from "@shared/schema";
import { getIconComponent } from "@/assets/icons/certifications";

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const getIconClass = () => {
    switch (subject.color) {
      case 'blue': return 'bg-blue-100 group-hover:bg-blue-200 text-primary';
      case 'orange': return 'bg-orange-100 group-hover:bg-orange-200 text-accent';
      case 'green': return 'bg-green-100 group-hover:bg-green-200 text-secondary';
      default: return 'bg-gray-100 group-hover:bg-gray-200 text-gray-600';
    }
  };

  // Try to get official certification icon first
  const IconComponent = subject.name ? getIconComponent(subject.name) : null;

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg mb-4 transition-colors">
          {IconComponent ? (
            <IconComponent className="w-12 h-12" />
          ) : (
            <div className={`flex items-center justify-center w-full h-full rounded-lg ${getIconClass()}`}>
              <i className={`${subject.icon} text-2xl`}></i>
            </div>
          )}
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
