import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";

export default function SlugExamInterface() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/:subjectSlug/:examSlug");

  const subjectSlug = params?.subjectSlug;
  const examSlug = params?.examSlug;

  // Fetch subjects and exams to resolve slug combination
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    enabled: !!subjectSlug && !!examSlug,
  });

  const subject = subjects?.find((s: any) => s.slug === subjectSlug);

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: [`/api/exams/by-subject/${subject?.id}`],
    enabled: !!subject?.id,
  });

  const exam = exams?.find((e: any) => e.slug === examSlug);
  const isLoading = subjectsLoading || examsLoading;

  useEffect(() => {
    if (exam && subject) {
      // Redirect to the exam interface using the resolved exam ID
      setLocation(`/exam/${exam.id}`);
    } else if (!subjectsLoading && !examsLoading && subjectSlug && examSlug && (!subject || !exam)) {
      // If slug resolution fails, redirect to homepage
      setLocation("/");
    }
  }, [exam, subject, subjectsLoading, examsLoading, subjectSlug, examSlug, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  return null; // This component only handles redirects
}