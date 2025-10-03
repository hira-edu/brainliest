/*
 * Server module composes shared types from the UI package which Next lint treats as `any` without
 * project references. Disable related lint rules for this file.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import { notFound } from 'next/navigation';
import {
  PracticePageHeader,
  PracticeExamCard,
  PracticeLayout,
  PracticeQuestionCard,
  PracticeNavigation,
  Card,
  Stack,
  Badge,
} from '@brainliest/ui';
import { PracticeClient } from './PracticeClient';
import { fetchPracticeSession } from '@/lib/practice/fetch-practice-session';

function formatTimeRemaining(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) {
    return undefined;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const padded = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${padded}`;
}

interface PracticePageProps {
  params: {
    examSlug: string;
  };
}

export default async function PracticePage({ params }: PracticePageProps) {
  const session = await fetchPracticeSession(params.examSlug);

  if (session.fromSample && params.examSlug !== 'a-level-math') {
    notFound();
  }

  const { exam, question, progress } = session;
  const timeRemainingDisplay = formatTimeRemaining(progress.timeRemainingSeconds);

  const sidebar = (
    <Stack gap={4}>
      <PracticeNavigation
        progressLabel={`Question ${progress.questionIndex} of ${progress.totalQuestions}`}
        disablePrevious
        rightSlot={
          timeRemainingDisplay ? (
            <span className="font-medium text-gray-700">Time left: {timeRemainingDisplay}</span>
          ) : undefined
        }
      />
      <Card padding="md" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Session checklist</h3>
        <ul className="ml-5 list-disc text-sm text-gray-600">
          <li>Flag questions to revisit later</li>
          <li>Toggle calculator mode when allowed</li>
          <li>Review hints before requesting AI help</li>
        </ul>
      </Card>
      <Card padding="md" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Keyboard shortcuts</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <p><kbd className="rounded border border-slate-200 px-1 py-0.5">J</kbd> Next question</p>
          <p><kbd className="rounded border border-slate-200 px-1 py-0.5">K</kbd> Previous question</p>
          <p><kbd className="rounded border border-slate-200 px-1 py-0.5">/</kbd> Command palette</p>
        </div>
      </Card>
    </Stack>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PracticePageHeader
        eyebrow="Brainliest Practice"
        title={exam.title}
        description={exam.description}
        aside={<Badge variant="outline">{session.fromSample ? 'Sample session' : 'Session draft'}</Badge>}
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

        <PracticeLayout sidebar={sidebar}>
          <PracticeQuestionCard
            label={`Question ${progress.questionIndex}`}
            title={question.stemMarkdown}
            difficulty={question.difficulty}
          >
            <PracticeClient question={question} />
          </PracticeQuestionCard>
        </PracticeLayout>
      </div>
    </div>
  );
}
