"use client"; // Fixed: RSC directive for Vercel compatibility

import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Subject, Exam } from "../../../../../shared/schema";
import ExamCard from "../components/exam-card";
import { ErrorMessage } from "./ErrorMessage";
import { Header } from "../../shared";
import { ArrowLeft, ClipboardList } from "lucide-react"; // Fixed: Replace FontAwesome with Lucide
import { Button } from "../../../components/ui/button";
import { DynamicIcon } from "../../../utils/dynamic-icon";
import SEOHead from "../../shared/components/seo-head";

// Fixed: Reusable SubjectHeader component to reduce duplication
interface SubjectHeaderProps {
  subject: Subject;
  examCount: number;
  onGoBack: () => void;
  isLoading?: boolean;
}

function SubjectHeader({ subject, examCount, onGoBack, isLoading = false }: SubjectHeaderProps) {
  // Fixed: Validate subject icon with fallback
  const subjectIcon = subject.icon || "book-open";
  const subjectName = subject.name || "Unknown Subject";
  const subjectDescription = subject.description || "No description available";

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoBack}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Back to subjects list" // Fixed: Accessibility
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                <DynamicIcon 
                  name={subjectIcon} 
                  className="w-6 h-6 text-blue-600" // Fixed: Use standard color instead of custom primary
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{subjectName}</h1>
                <p className="text-sm text-gray-600">{subjectDescription}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {isLoading ? "Loading exams..." : `${examCount} Available Exam${examCount !== 1 ? 's' : ''}`}
            </div>
            <div className="text-xs text-gray-500">
              {isLoading ? "Please wait" : "Choose an exam to start practicing"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamSelection() {
  const [, setLocation] = useLocation();

  // Fixed: Remove ID-based routing, use only slug-based routing
  const [slugMatch, slugParams] = useRoute("/subject/:slug");
  const subjectSlug = slugMatch && slugParams?.slug ? slugParams.slug : null;

  // Fixed: Enhanced subject query with error handling and performance optimization
  const {
    data: subject,
    isLoading: isSubjectLoading,
    error: subjectError,
    refetch: refetchSubject
  } = useQuery<Subject>({
    queryKey: [`/api/subjects/by-slug/${subjectSlug}`],
    queryFn: async () => {
      if (!subjectSlug) throw new Error('Subject slug is required');
      const res = await fetch(`/api/subjects/by-slug/${subjectSlug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Subject not found');
        throw new Error('Failed to fetch subject');
      }
      return res.json();
    },
    enabled: !!subjectSlug,
    staleTime: 300000, // Fixed: Performance optimization
    retry: 2
  });

  // Fixed: Enhanced exams query with proper dependency and error handling
  const {
    data: exams,
    isLoading: isExamsLoading,
    error: examsError,
    refetch: refetchExams
  } = useQuery<Exam[]>({
    queryKey: ["/api/exams", subject?.slug],
    queryFn: async () => {
      if (!subject?.slug) throw new Error('Subject slug is required for fetching exams');
      const response = await fetch(`/api/exams?subjectSlug=${subject.slug}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!subject?.slug,
    staleTime: 300000, // Fixed: Performance optimization
    retry: 2
  });

  // Fixed: Slug-only navigation with validation and development logging
  const handleStartExam = (exam: Exam) => {
    if (!exam.slug) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Exam missing slug:', exam);
      }
      return;
    }
    setLocation(`/exam/${exam.slug}`);
  };

  const handleGoBack = () => {
    setLocation("/");
  };

  // Fixed: Handle missing subject slug case
  if (!subjectSlug) {
    return (
      <ErrorMessage
        title="Subject not found"
        message="No subject was specified in the URL. Please navigate from the subjects list."
        onRetry={() => setLocation('/')}
        showRetry={true}
      />
    );
  }

  // Fixed: Enhanced error handling for subject and exams
  if (subjectError) {
    return (
      <ErrorMessage
        title="Failed to load subject"
        message={subjectError.message || "We couldn't load this subject. Please try again."}
        onRetry={refetchSubject}
        context={`subject "${subjectSlug}"`}
        showRetry={true}
      />
    );
  }

  if (examsError && subject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {/* Fixed: SEO with dynamic content */}
        <SEOHead
          title={`${subject.name} Exams - Brainliest`}
          description={`Practice exams for ${subject.name}. ${subject.description}`}
          keywords={[subject.name, 'exams', 'practice tests', 'certification']}
        />
        <SubjectHeader 
          subject={subject} 
          examCount={0} 
          onGoBack={handleGoBack} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage
            title="Failed to load exams"
            message={examsError.message || "We couldn't load the exams for this subject."}
            onRetry={refetchExams}
            context={`exams for ${subject.name}`}
            isFullscreen={false}
          />
        </div>
      </div>
    );
  }

  const isLoading = isSubjectLoading || isExamsLoading;

  // Fixed: Loading state with reusable header
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {subject && (
          <SubjectHeader 
            subject={subject} 
            examCount={0} 
            onGoBack={handleGoBack} 
            isLoading={true}
          />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading exams...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fixed: Main content with enhanced error handling and SEO
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Fixed: SEO with dynamic content */}
      {subject && (
        <SEOHead
          title={`${subject.name} Exams - Brainliest`}
          description={`Practice exams for ${subject.name}. ${subject.description || 'Comprehensive practice tests and certification preparation.'}`}
          keywords={[subject.name, 'exams', 'practice tests', 'certification', ...(exams?.map(e => e.title) || [])]}
        />
      )}

      {/* Fixed: Use reusable SubjectHeader component */}
      {subject && (
        <SubjectHeader 
          subject={subject} 
          examCount={exams?.length || 0} 
          onGoBack={handleGoBack} 
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fixed: Enhanced exam display logic */}
        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCard 
                key={exam.slug || exam.id} // Fixed: Fallback key
                exam={exam} 
                onStart={() => handleStartExam(exam)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {/* Fixed: Replace FontAwesome with Lucide icon */}
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {/* Fixed: Include subject name in message */}
                No exams available for {subject?.name || 'this subject'}
              </h3>
              <p className="text-gray-600 mb-4">
                There are currently no exams in this section. Please check back later.
              </p>
              <p className="text-sm text-gray-500">
                We're constantly adding new content and practice exams to help you succeed.
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleGoBack}
                  className="inline-flex items-center" // Fixed: Use default Button styles
                  aria-label="Back to subjects list" // Fixed: Accessibility
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subjects
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}