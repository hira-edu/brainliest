'use client';

import { useState } from 'react';
import {
  PracticeLayout,
  PracticeExamCard,
  PracticeQuestionCard,
  PracticeQuestionActions,
  PracticeQuestionStatus,
  PracticeQuestionExplanation,
  PracticeQuestionFooter,
  PracticeQuestionContent,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
  PracticeOptionList,
  PracticeExplanationCard,
  PracticeExplainButton,
  Button,
} from '@brainliest/ui';

const demoOptions = [
  { id: 'choice-a', label: 'Apply chain rule', description: 'Differentiate inner and outer functions separately.' },
  { id: 'choice-b', label: 'Use quotient rule', description: 'Reserve for rational expressions.' },
  { id: 'choice-c', label: 'Apply power rule', description: 'Differentiate term-by-term when exponents are constants.' },
];

export default function PracticeNavigationDemoPage() {
  const [isFlagged, setIsFlagged] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Practice navigation kit</h1>
        <p className="text-gray-600">
          Preview the reusable practice layout, navigation panel, and supporting cards used by the session experience.
          All controls are wired together locally so you can exercise flag/bookmark flows without hitting the API.
        </p>
      </header>

      <PracticeLayout
        sidebar={
          <PracticeSidebar>
            <PracticeExamCard
              title="Session overview"
              subtitle="Algebra II practice set"
              description="Derived from the shared exam metadata. Stats and tags mirror the live practice route."
              tags={['Timed', 'STEM', 'Adaptive']}
              stats={[
                { label: 'Questions', value: '24' },
                { label: 'Passing score', value: '75%' },
                { label: 'Attempts left', value: 'Unlimited' },
              ]}
            />
            <PracticeSidebarChecklistCard
              items={['Flag questions to revisit later', 'Toggle calculator mode when allowed', 'Review hints before requesting AI help']}
            />
            <PracticeSidebarShortcutsCard
              shortcuts={[
                { key: 'J', description: 'Next question' },
                { key: 'K', description: 'Previous question' },
                { key: '/', description: 'Command palette' },
              ]}
            />
          </PracticeSidebar>
        }
      >
        <PracticeQuestionCard
          label="Question"
          title="Which derivative rule applies to f(x) = x^3?"
          difficulty="MEDIUM"
          actions={
            <PracticeQuestionActions
              isBookmarked={isBookmarked}
              onToggleBookmark={(next: boolean) => setIsBookmarked(next)}
              isFlagged={isFlagged}
              onToggleFlag={(next: boolean) => setIsFlagged(next)}
              timerLabel="12:24"
            />
          }
        >
            <PracticeQuestionContent>
              <PracticeQuestionStatus
                message={
                  isFlagged
                    ? 'This question is flagged for review.'
                  : isBookmarked
                  ? 'This question is bookmarked for quick access.'
                  : 'Review the prompt and select your answer.'
              }
            />
            <PracticeExplainButton
              isActive={showExplanation}
              onClick={() => setShowExplanation((next) => !next)}
              label={showExplanation ? 'Hide question explanation' : 'AI explanation'}
              aria-label={showExplanation ? 'Hide question explanation' : 'Toggle question explanation'}
            />
            <PracticeOptionList
              options={demoOptions}
              legend="Select the best approach"
              value={selected}
              onChange={setSelected}
            />
            <PracticeQuestionFooter
              progressLabel="Question 2 of 10"
              leadingSlot={
                <div className="flex flex-col gap-1">
                  <PracticeExplainButton
                    label="Generate explanation"
                    onClick={() => window.alert('Generate explanation demo')}
                    aria-label="Generate answer explanation"
                  />
                  <p className="text-xs text-gray-500">Powered by the shared AI explanation service.</p>
                </div>
              }
              trailingSlot={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => {
                      setIsSubmitted(true);
                      setHasRevealed(false);
                    }}
                    disabled={isSubmitted || !selected}
                  >
                    Submit answer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setHasRevealed(true)}
                    disabled={!isSubmitted || hasRevealed}
                  >
                    Reveal correct answer
                  </Button>
                </div>
              }
              onPrevious={() => window.alert('Previous question callback')}
              onNext={() => window.alert('Next question callback')}
            />
            {hasRevealed ? (
              <p className="text-sm font-medium text-success-700">
                Correct answer: choice-a
              </p>
            ) : null}
          </PracticeQuestionContent>
        </PracticeQuestionCard>
        <PracticeQuestionExplanation
          visible={showExplanation}
          content="Because f(x) = x^3 is a simple monomial, the power rule applies directly: f'(x) = 3x^2."
        />
        <PracticeExplanationCard
          summary="Great job — this mock explanation highlights how the card renders inside the layout."
          confidence="high"
          keyPoints={['Apply the power rule term-by-term', 'Lower the exponent by one', 'Multiply by the previous exponent']}
          steps={['Identify term exponents', 'Differentiate using the rule', 'Simplify the resulting polynomial']}
          footer="Explain card renders below the question when an answer is evaluated."
        />
      </PracticeLayout>
    </main>
  );
}
