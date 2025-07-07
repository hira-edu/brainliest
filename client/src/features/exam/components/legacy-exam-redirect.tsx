import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface LegacyExamRedirectProps {
  examId: string;
}

export default function LegacyExamRedirect({ examId }: LegacyExamRedirectProps) {
  const [, setLocation] = useLocation();
  
  // Fetch exam and subject data to construct the slug-based URL
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId && !isNaN(Number(examId)),
  });

  const { data: subject, isLoading: subjectLoading } = useQuery({
    queryKey: [`/api/subjects/${exam?.subjectId}`],
    enabled: !!exam?.subjectId,
  });

  useEffect(() => {
    if (exam && subject && !examLoading && !subjectLoading) {
      // Redirect to the new slug-based URL format
      const newUrl = `/exam/${subject.slug}/${exam.slug}`;
      console.log(`Redirecting legacy URL /exam/${examId} to ${newUrl}`);
      setLocation(newUrl);
    } else if (!examLoading && !subjectLoading && (!exam || !subject)) {
      // If exam/subject not found, redirect to home
      console.log(`Exam ${examId} not found, redirecting to home`);
      setLocation("/");
    }
  }, [exam, subject, examLoading, subjectLoading, examId, setLocation]);

  // Show loading state while redirecting
  if (examLoading || subjectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to new URL...</p>
        </div>
      </div>
    );
  }

  return null; // This component only handles redirects
}