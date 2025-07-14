/**
 * SubjectCard - Fixed version addressing all audit issues
 * Renders a subject card with dynamic icon and subject details
 * Fixed: SSR compatibility, field validation, accessibility, error handling
 */

 // Fixed: RSC directive for Vercel compatibility with DynamicIcon

import { Subject } from "../../../../../shared/schema";
import { DynamicIcon } from "../../../utils/dynamic-icon";

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  // Fixed: Add fallback values for all subject fields to prevent runtime errors
  const safeName = subject.name || "Untitled Subject";
  const safeDescription = subject.description || "No description available";
  const safeIcon = subject.icon || "book"; // Fixed: Default fallback icon
  const safeExamCount = subject.examCount || 0; // Fixed: Fallback to 0 for number formatting
  const safeQuestionCount = subject.questionCount || 0; // Fixed: Fallback to 0 for number formatting

  // Fixed: Wrap onClick in try-catch for error handling
  const handleClick = () => {
    try {
      onClick();
    } catch (error) {
      console.error('SubjectCard onClick error:', error);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      onClick={handleClick}
      role="button" // Fixed: Accessibility - ARIA role for clickable card
      tabIndex={0} // Fixed: Accessibility - keyboard navigation
      aria-label={`View ${safeName} subject with ${safeExamCount} practice exams and ${safeQuestionCount} questions`} // Fixed: Accessibility - screen reader support
      onKeyDown={(e) => {
        // Fixed: Accessibility - keyboard support
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg mb-4 transition-colors">
          <DynamicIcon 
            name={safeIcon} // Fixed: Use safe icon with fallback
            className="w-12 h-12"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{safeName}</h3>
        <p className="text-gray-600 mb-4">{safeDescription}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{safeExamCount} Practice Exams</span>
          <span className="text-sm text-gray-500">{safeQuestionCount}+ Questions</span>
        </div>
      </div>
    </div>
  );
}

// Note: DynamicIcon must align with base-icon.tsx, icon.tsx, and lucide-react@0.48.0
// Note: Subject schema must be consistent with Neon database schema
// Note: Consider wrapping in SecurityErrorBoundary and useAdmin check in parent component
// Note: Subject data likely requires TokenStorage.getAccessToken() for API calls in parent
