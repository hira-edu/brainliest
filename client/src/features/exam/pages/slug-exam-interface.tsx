import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect, useState } from "react";
import QuestionInterface from "./question-interface";

export default function SlugExamInterface() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/:subjectSlug/:examSlug");
  const [examId, setExamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const subjectSlug = params?.subjectSlug;
  const examSlug = params?.examSlug;

  // Resolve slug to exam ID
  const { data: resolvedData, isLoading, error } = useQuery({
    queryKey: [`/api/slug-resolve/${subjectSlug}/${examSlug}`],
    queryFn: async () => {
      const response = await fetch(`/api/slug-resolve/${subjectSlug}/${examSlug}`);
      if (!response.ok) throw new Error('Failed to resolve slug');
      return response.json();
    },
    enabled: !!subjectSlug && !!examSlug,
  });

  useEffect(() => {
    if (resolvedData) {
      setExamId(resolvedData.examId);
      setLoading(false);
    } else if (error) {
      // If slug resolution fails, redirect to homepage
      setLocation("/");
    }
  }, [resolvedData, error, setLocation]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
          <p className="text-gray-600 mb-6">The exam you're looking for could not be found.</p>
          <button
            onClick={() => setLocation("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Render the existing QuestionInterface with the resolved exam ID
  return <QuestionInterface examId={examId} />;
}