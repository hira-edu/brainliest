import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Exam, Subject, Question } from "../../../../../shared/schema";

// Route parameter validation schema
const examParamsSchema = z.union([
  z.object({ slug: z.string().min(1), type: z.literal("slug") }),
  z.object({ id: z.number().int().positive(), type: z.literal("id") })
]);

type ExamParams = z.infer<typeof examParamsSchema>;

interface ExamLoaderData {
  exam: Exam | undefined;
  subject: Subject | undefined;
  questions: Question[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useExamLoader(slugOrId: string | number | null): ExamLoaderData {
  // Validate and normalize route parameters
  const params: ExamParams | null = (() => {
    try {
      if (typeof slugOrId === "string") {
        return examParamsSchema.parse({ slug: slugOrId, type: "slug" });
      } else if (typeof slugOrId === "number") {
        return examParamsSchema.parse({ id: slugOrId, type: "id" });
      }
      return null;
    } catch {
      return null;
    }
  })();

  // Fetch exam data
  const {
    data: exam,
    isLoading: isExamLoading,
    isError: isExamError,
    error: examError,
    refetch: refetchExam
  } = useQuery<Exam>({
    queryKey: ["exam", params?.type === "slug" ? params.slug : params?.id],
    queryFn: async () => {
      if (!params) throw new Error("Invalid exam parameters");
      
      const url = params.type === "slug"
        ? `/api/exams/by-slug/${params.slug}`
        : `/api/exams/${params.id}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch exam: ${res.status} ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!params,
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Create normalized subject query key
  const subjectKey = exam?.subjectSlug 
    ? ["subject", "slug", exam.subjectSlug]
    : null;

  // Fetch subject data
  const {
    data: subject,
    isLoading: isSubjectLoading,
    isError: isSubjectError,
    error: subjectError,
    refetch: refetchSubject
  } = useQuery<Subject>({
    queryKey: subjectKey,
    queryFn: async () => {
      if (!exam) throw new Error("Exam data required for subject fetch");
      
      const url = `/api/subjects/by-slug/${exam.subjectSlug}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch subject: ${res.status} ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!exam && !!subjectKey,
    retry: 2,
    staleTime: 5 * 60 * 1000
  });

  // Fetch questions data
  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
    refetch: refetchQuestions
  } = useQuery<{ questions: Question[]; freemiumSession?: any }>({
    queryKey: ["questions", params?.type === "slug" ? params.slug : params?.id],
    queryFn: async () => {
      if (!params) throw new Error("Invalid exam parameters for questions");
      
      const url = params.type === "slug"
        ? `/api/questions?examSlug=${params.slug}`
        : `/api/questions?examId=${params.id}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch questions: ${res.status} ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!params,
    retry: 2,
    staleTime: 2 * 60 * 1000 // 2 minutes for questions
  });

  const questions = questionsData?.questions || [];

  const isLoading = isExamLoading || isSubjectLoading || isQuestionsLoading;
  const isError = isExamError || isSubjectError || isQuestionsError;
  const error = examError || subjectError || questionsError;

  const refetch = () => {
    refetchExam();
    refetchSubject();
    refetchQuestions();
  };

  return {
    exam,
    subject,
    questions,
    isLoading,
    isError,
    error,
    refetch
  };
}