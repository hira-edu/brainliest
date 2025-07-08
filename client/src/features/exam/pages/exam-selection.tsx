import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Subject, Exam } from "@shared/schema";
import ExamCard from "../components/exam-card";
import { Header } from "../../shared";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamSelection() {
  const [, setLocation] = useLocation();
  
  // Try slug-based route first, then fall back to ID-based route
  const [slugMatch, slugParams] = useRoute("/subject/:slug");
  const [idMatch, idParams] = useRoute("/subject/id/:id");
  
  const isSlugRoute = slugMatch && slugParams?.slug;
  const isIdRoute = idMatch && idParams?.id;
  
  const subjectSlug = isSlugRoute ? slugParams.slug : null;
  const subjectId = isIdRoute ? parseInt(idParams.id) : null;

  // Fetch subject by slug or ID
  const { data: subject } = useQuery<Subject>({
    queryKey: isSlugRoute ? [`/api/subjects/by-slug/${subjectSlug}`] : [`/api/subjects/${subjectId}`],
    enabled: !!(subjectSlug || subjectId),
  });

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams", subject?.slug],
    queryFn: async () => {
      const response = await fetch(`/api/exams?subjectSlug=${subject?.slug}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!subject?.slug,
  });

  const handleStartExam = (exam: Exam) => {
    // Use slug-based navigation if exam has slug, otherwise use ID
    const examPath = exam.slug ? `/exam/${exam.slug}` : `/exam/id/${exam.id}`;
    setLocation(examPath);
  };

  const handleGoBack = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Subject Header with Back Button - Same style as question interface */}
        {subject && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Subjects
                  </Button>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div className="flex items-center">
                    <i className={`${subject.icon} text-2xl text-primary mr-3`}></i>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">{subject.name}</h1>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Loading exams...</div>
                  <div className="text-xs text-gray-500">Please wait</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Subject Header with Back Button - Same style as question interface */}
      {subject && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subjects
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center">
                  <i className={`${subject.icon} text-2xl text-primary mr-3`}></i>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{subject.name}</h1>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{exams?.length || 0} Available Exams</div>
                <div className="text-xs text-gray-500">Choose an exam to start practicing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Only show "no exams" if loading is complete and there are actually no exams */}
        {!isLoading && exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCard 
                key={exam.slug} 
                exam={exam} 
                onStart={() => handleStartExam(exam)}
                // Completion tracking implemented via user sessions and analytics
              />
            ))}
          </div>
        ) : !isLoading && (!exams || exams.length === 0) ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-clipboard-list text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Available</h3>
              <p className="text-gray-600 mb-4">
                There are currently no exams in this section. Please check back later.
              </p>
              <p className="text-sm text-gray-500">
                We're constantly adding new content and practice exams to help you succeed.
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleGoBack}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subjects
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
