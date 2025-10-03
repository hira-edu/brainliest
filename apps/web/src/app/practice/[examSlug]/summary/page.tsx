'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge, PracticeExamCard, PracticePageHeader } from '@brainliest/ui';
import { mapApiResponseToPracticeSessionData } from '@/lib/practice/mappers';
import type { PracticeSessionApiResponse, PracticeSessionData } from '@/lib/practice/types';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'x-user-id': 'demo-user',
};

const formatDuration = (seconds: number): string => {
  const safe = Math.max(0, Math.trunc(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export default function PracticeSummaryPage() {
  const params = useParams<{ examSlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const examSlug = params?.examSlug ?? '';
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<PracticeSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace(`/practice/${examSlug}`);
      return;
    }

    let cancelled = false;
    setError(null);
    setSession(null);

    fetch(`/api/practice/sessions/${sessionId}`, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load session ${sessionId}`);
        }
        const payload = (await response.json()) as PracticeSessionApiResponse;
        const next = mapApiResponseToPracticeSessionData(payload);
        if (cancelled) {
          return;
        }
        if (next.sessionStatus !== 'completed') {
          router.replace(`/practice/${examSlug}`);
          return;
        }
        setSession(next);
      })
      .catch((fetchError) => {
        if (cancelled) {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load practice summary.');
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, examSlug, router]);

  const stats = useMemo(() => {
    if (!session) {
      return [] as { label: string; value: string }[];
    }

    const totalQuestions = session.questions.length;
    const totalAnswered = session.questions.filter((question) => question.isSubmitted).length;
    const correctAnswers = session.questions.filter((question) => question.isCorrect === true).length;
    const incorrectAnswers = session.questions.filter((question) => question.isCorrect === false).length;
    const flaggedCount = session.flaggedQuestionIds.length;
    const bookmarkedCount = session.bookmarkedQuestionIds.length;
    const totalTimeSeconds = session.questions.reduce(
      (accumulator, question) => accumulator + (question.timeSpentSeconds ?? 0),
      0
    );
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

    return [
      { label: 'Questions answered', value: `${totalAnswered} / ${totalQuestions}` },
      { label: 'Correct answers', value: `${correctAnswers}` },
      { label: 'Incorrect answers', value: `${incorrectAnswers}` },
      { label: 'Accuracy', value: `${accuracy}%` },
      { label: 'Flagged', value: `${flaggedCount}` },
      { label: 'Bookmarked', value: `${bookmarkedCount}` },
      { label: 'Total time', value: formatDuration(totalTimeSeconds) },
    ];
  }, [session]);

  if (!session && !error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center text-gray-600">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Preparing results</p>
        <p className="text-lg">Fetching your practice summary…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center text-gray-600">
        <p className="text-lg font-semibold text-error-600">Unable to load practice summary.</p>
        <p className="text-sm">{error ?? 'Please return to the practice module and try again.'}</p>
        <Link
          href={`/practice/${examSlug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          Back to practice
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <PracticePageHeader
        eyebrow="Practice summary"
        title={session.exam.title}
        description="Review your results and plan the next steps for your study session."
        aside={<Badge variant="success">Exam completed</Badge>}
      />

      <PracticeExamCard
        title="Session overview"
        subtitle="Performance snapshot"
        description={
          session.exam.description ??
          'Well done finishing this module. Use the breakdown below to focus your revision.'
        }
        tags={session.exam.tags}
        stats={[
          { label: 'Questions', value: String(session.exam.totalQuestions) },
          { label: 'Passing score', value: session.exam.passingScore ?? '—' },
          { label: 'Difficulty mix', value: session.exam.difficultyMix ?? '—' },
          { label: 'Duration', value: session.exam.durationMinutes ? `${session.exam.durationMinutes}m` : '—' },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Question breakdown</h2>
        <div className="space-y-3">
          {session.questions.map((question, index) => {
            const isCorrect = question.isCorrect;
            const isSubmitted = question.isSubmitted;
            const statusLabel = isCorrect === true
              ? 'Correct'
              : isCorrect === false
              ? 'Incorrect'
              : isSubmitted
              ? 'Submitted'
              : 'Not answered';
            const statusVariant = isCorrect === true ? 'success' : isCorrect === false ? 'error' : 'secondary';
            const explanation = question.question.explanationMarkdown;

            return (
              <div
                key={question.questionId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
                      Question {index + 1}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {question.question.stemMarkdown}
                    </p>
                  </div>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p>
                    {isCorrect === true
                      ? 'Your submission matched the correct solution.'
                      : isCorrect === false
                      ? 'Your submission differed from the correct solution. Review the explanation to understand the expected approach.'
                      : isSubmitted
                      ? 'Answer submitted but marked as neutral. Review the explanation for additional guidance.'
                      : 'You did not submit an answer for this question.'}
                  </p>
                  {explanation ? (
                    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary-600">View explanation</summary>
                      <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{explanation}</p>
                    </details>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/practice/${examSlug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          Start new practice session
        </Link>
        <Link
          href={`/practice/${examSlug}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Review practice module
        </Link>
      </div>
    </div>
  );
}
