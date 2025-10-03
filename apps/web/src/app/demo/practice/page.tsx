'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  PracticeExplainButton,
  PracticeExplanationCard,
  PracticeLayout,
  PracticeNavigation,
  PracticeOptionList,
  PracticeQuestionActions,
  PracticeQuestionCard,
  PracticeQuestionContent,
  PracticeQuestionExplanation,
  PracticeQuestionStatus,
  PracticeQuestionFooter,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
  PracticeExamCard,
  Stack,
} from '@brainliest/ui';

const options = [
  { id: 'a', label: 'Option A — 3x²', description: 'Differentiate using the power rule.' },
  { id: 'b', label: 'Option B — x²', description: 'Drops a coefficient; incorrect.' },
  { id: 'c', label: 'Option C — 3x', description: 'Forgets to reduce the exponent.' },
  { id: 'd', label: 'Option D — x³', description: 'Original function, no differentiation.' },
];

const examStats = [
  { label: 'Timer', value: '44:12 remaining' },
  { label: 'Flagged', value: '2 questions' },
  { label: 'Bookmarks', value: '5 saved' },
];

export default function PracticeShowcasePage() {
  const [selectedOption, setSelectedOption] = useState<string>('a');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Practice kit</p>
        <h1 className="text-3xl font-bold text-gray-900">Interactive exam experience</h1>
        <p className="max-w-3xl text-gray-600">
          The practice components compose the learner experience—question cards, AI explanations, navigation, and the
          supporting sidebar widgets used throughout the product.
        </p>
      </header>

      <PracticeLayout
        sidebar={
          <PracticeSidebar>
            <PracticeExamCard
              title="Algebra II — Mock Paper"
              subtitle="Timed session"
              stats={examStats}
              tags={['Differentiation', 'Integration', 'Series']}
            />
            <PracticeSidebarChecklistCard
              items={[
                'Review hints before requesting AI help',
                'Flag tricky problems to revisit at the end',
                'Double-check calculator mode is allowed',
              ]}
            />
            <PracticeSidebarShortcutsCard
              shortcuts={[
                { key: 'J', description: 'Next question' },
                { key: 'K', description: 'Previous question' },
                { key: '/', description: 'Open command palette' },
              ]}
            />
          </PracticeSidebar>
        }
      >
        <PracticeQuestionCard
          label="Question 12"
          title="What is the derivative of f(x) = x³?"
          difficulty="MEDIUM"
          actions={
            <PracticeQuestionActions
              isBookmarked={isBookmarked}
              onToggleBookmark={setIsBookmarked}
              isFlagged={isFlagged}
              onToggleFlag={setIsFlagged}
              timerLabel="44:12"
            />
          }
        >
          <PracticeQuestionContent>
            <PracticeQuestionStatus
              variant={
                isFlagged
                  ? 'warning'
                  : isBookmarked
                  ? 'info'
                  : 'info'
              }
              title={
                isFlagged
                  ? 'Flagged for review'
                  : isBookmarked
                  ? 'Bookmarked'
                  : 'Ready to answer'
              }
              description={
                isFlagged
                  ? 'Flagged for review. Unflag once you feel confident in your answer.'
                  : isBookmarked
                  ? 'Bookmarked—this question will appear in your personal review list.'
                  : 'Select the correct derivative before submitting.'
              }
            />
            <PracticeExplainButton
              label={showExplanation ? 'Hide question explanation' : 'Show stored explanation'}
              isActive={showExplanation}
              onClick={() => setShowExplanation((previous) => !previous)}
            />
            <PracticeQuestionExplanation
              visible={showExplanation}
              content="Differentiate using the power rule: f'(x) = 3x². Remember to multiply by the exponent and reduce it by one."
            />
            <PracticeOptionList
              legend="Select one answer"
              options={options}
              value={selectedOption}
              onChange={setSelectedOption}
            />
            <PracticeQuestionFooter
              progressLabel="Question 12 of 24"
              onPrevious={() => undefined}
              onNext={() => undefined}
              leadingSlot={
                <Stack gap={2}>
                  <Badge variant="info">Calculator allowed</Badge>
                  <span className="text-xs text-gray-500">Use the up/down keys to switch between questions.</span>
                </Stack>
              }
              trailingSlot={
                <div className="flex items-center gap-2">
                  <Button variant="ghost">Reveal answer</Button>
                  <Button>Submit answer</Button>
                </div>
              }
            />
          </PracticeQuestionContent>
        </PracticeQuestionCard>

        <PracticeExplanationCard
          summary="Great job — differentiating x³ yields 3x² by multiplying the power and decreasing it by one."
          confidence="high"
          keyPoints={['Apply the power rule', 'Reduce the exponent by one', 'Simplify coefficients']}
          steps={['Identify the exponent (3)', 'Multiply by the exponent', 'Subtract one from the exponent']}
        />

        <PracticeNavigation
          progressLabel="Question 12 of 24"
          onPrevious={() => undefined}
          onNext={() => undefined}
          leadingSlot={<span className="text-sm text-gray-500">Use J / K to move between questions quickly.</span>}
          trailingSlot={<Button variant="ghost">Jump to review</Button>}
        />
      </PracticeLayout>
    </main>
  );
}
