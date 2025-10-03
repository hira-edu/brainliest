/*
 * Server module composes shared types from the UI package which Next lint treats as `any` without
 * project references. Disable related lint rules for this file.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import { notFound } from 'next/navigation';
import { Badge, PracticeExamCard, PracticePageHeader } from '@brainliest/ui';
import { fetchPracticeSession } from '@/lib/practice/fetch-practice-session';
import { PracticeSessionContainer } from './PracticeSessionContainer';

interface PracticePageParams {
  examSlug: string;
}

export default async function PracticePage({ params }: { params: Promise<PracticePageParams> }) {
  const { examSlug } = await params;

  const session = await fetchPracticeSession(examSlug);

  if (session.fromSample && examSlug !== 'a-level-math') {
    notFound();
  }

  const { exam } = session;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PracticePageHeader
        eyebrow="Brainliest Practice"
        title={exam.title}
        description={exam.description}
        aside={<Badge variant="secondary">{session.fromSample ? 'Sample session' : 'Session draft'}</Badge>}
      />

      <div className="mt-8 space-y-8">
        <PracticeExamCard
          title="Session overview"
          subtitle="Module summary"
          description={
            exam.description ??
            'Focus on mastering the core derivative rules before moving to applied questions. Each explanation uses the shared AI service with caching and rate limiting.'
          }
          tags={exam.tags}
          stats={[
            { label: 'Questions', value: String(exam.totalQuestions) },
            { label: 'Passing score', value: exam.passingScore ?? '—' },
            { label: 'Attempts left', value: exam.attemptsAllowed ?? 'Unlimited' },
            { label: 'Difficulty mix', value: exam.difficultyMix ?? '—' },
          ]}
        />

        <PracticeSessionContainer initialData={session} />
      </div>
    </div>
  );
}
