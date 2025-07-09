import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { UserSession, Question, Exam, Subject } from "../../../../../shared/schema";
import { ExamResult, DomainResult } from "../../../../../shared/types";
import { Header } from "../../shared";

export default function Results() {
  const [, setLocation] = useLocation();

  // Slug-first, ID-fallback for session identifier
  const [slugMatch, slugParams] = useRoute("/results/:slug");
  const [idMatch, idParams] = useRoute("/results/id/:id");
  const isSlugRoute = slugMatch && !!slugParams?.slug;
  const isIdRoute = idMatch && !!idParams?.id;
  const sessionSlug = isSlugRoute ? slugParams.slug : null;
  const sessionId = isIdRoute ? parseInt(idParams.id, 10) : null;

  // 1) Load session
  const {
    data: session,
    isLoading: loadingSession,
    isError: errorSession
  } = useQuery<UserSession>({
    queryKey: ["session", sessionSlug ?? sessionId],
    queryFn: async (): Promise<UserSession> => {
      const url = sessionSlug
        ? `/api/sessions/by-slug/${sessionSlug}`
        : `/api/sessions/${sessionId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!(sessionSlug || sessionId)
  });

  // 2) Load exam
  const {
    data: exam,
    isLoading: loadingExam,
    isError: errorExam
  } = useQuery<Exam>({
    queryKey: ["exam", session?.examSlug ?? session?.examId],
    queryFn: async (): Promise<Exam> => {
      const url = session?.examSlug
        ? `/api/exams/by-slug/${session.examSlug}`
        : `/api/exams/${session?.examId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
    enabled: !!(session?.examSlug || session?.examId)
  });

  // 3) Load questions
  const {
    data: questions,
    isLoading: loadingQuestions,
    isError: errorQuestions
  } = useQuery<Question[]>({
    queryKey: ["questions", session?.examSlug ?? session?.examId],
    queryFn: async (): Promise<Question[]> => {
      const param = session?.examSlug
        ? `examSlug=${session.examSlug}`
        : `examId=${session?.examId}`;
      const res = await fetch(`/api/questions?${param}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!(session?.examSlug || session?.examId)
  });

  // 4) Load subject for “Back to Exams”
  const {
    data: subject,
    isLoading: loadingSubject,
    isError: errorSubject
  } = useQuery<Subject>({
    queryKey: ["subject", exam?.subjectSlug ?? exam?.subjectId],
    queryFn: async (): Promise<Subject> => {
      const url = exam?.subjectSlug
        ? `/api/subjects/by-slug/${exam.subjectSlug}`
        : `/api/subjects/${exam?.subjectId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch subject");
      return res.json();
    },
    enabled: !!(exam?.subjectSlug || exam?.subjectId)
  });

  // Consolidated loading & error flags
  const isLoading =
    loadingSession ||
    loadingExam ||
    loadingQuestions ||
    loadingSubject;
  const hasError =
    errorSession ||
    errorExam ||
    errorQuestions ||
    errorSubject;

  // Time formatting
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Result calculation
  const calculateResults = (): ExamResult | null => {
    if (!session || !questions || !session.answers) return null;
    const total = questions.length;
    const correctCount = session.answers.reduce((acc, ans, idx) => {
      return questions[idx] && parseInt(ans) === questions[idx].correctAnswer
        ? acc + 1
        : acc;
    }, 0);
    const score =
      session.score ?? Math.round((correctCount / total) * 100);
    const timeSpent = formatTime(session.timeSpent ?? 0);

    const domainMap = new Map<string, { correct: number; total: number }>();
    questions.forEach((q, idx) => {
      const key = q.domain || "General";
      const data = domainMap.get(key) || { correct: 0, total: 0 };
      data.total += 1;
      if (parseInt(session.answers[idx] || "") === q.correctAnswer) {
        data.correct += 1;
      }
      domainMap.set(key, data);
    });

    const domains: DomainResult[] = Array.from(domainMap, ([name, d]) => ({
      name,
      score: Math.round((d.correct / d.total) * 100),
      percentage: (d.correct / d.total) * 100
    }));

    return { score, correct: correctCount, total, timeSpent, domains };
  };

  const results = calculateResults();

  // Navigation handlers
  const handleReviewAnswers = () => {
    console.info("Review answers feature coming soon");
  };
  const handleRetakeExam = () => {
    if (exam?.slug) setLocation(`/exam/${exam.slug}`);
    else if (session?.examId) setLocation(`/exam/id/${session.examId}`);
  };
  const handleGoToExams = () => {
    if (subject?.slug) setLocation(`/subject/${subject.slug}`);
    else if (exam?.subjectSlug)
      setLocation(`/subject/${exam.subjectSlug}`);
    else if (exam?.subjectId)
      setLocation(`/subject/id/${exam.subjectId}`);
    else setLocation("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError || !session || !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600">
            Unable to load results. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Final UI (unchanged)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ... rest of your existing JSX ... */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <i className="fas fa-trophy text-3xl text-green-600"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Completed!
          </h2>
          <p className="text-gray-600">
            Here's how you performed on {exam.title}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          {/* scores grid, domain bars, and buttons all remain exactly as you had them */}
          {/* ... */}
        </div>
      </div>
    </div>
  );
}
