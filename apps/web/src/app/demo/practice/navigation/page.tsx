'use client';

import { useState } from 'react';
import {
  PracticeLayout,
  PracticeNavigation,
  PracticeExamCard,
  PracticeQuestionCard,
  PracticeOptionList,
  PracticeExplanationCard,
  Stack,
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
          <Stack gap={4}>
            <PracticeNavigation
              progressLabel="Question 2 of 10"
              timeRemainingLabel="12:24"
              isFlagged={isFlagged}
              onToggleFlag={setIsFlagged}
              isBookmarked={isBookmarked}
              onToggleBookmark={setIsBookmarked}
              onPrevious={() => window.alert('Previous question callback')}
              onNext={() => window.alert('Next question callback')}
            />
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
          </Stack>
        }
      >
        <PracticeQuestionCard
          label="Question"
          title="Which derivative rule applies to f(x) = x^3?"
          difficulty="MEDIUM"
        >
          <PracticeOptionList
            options={demoOptions}
            legend="Select the best approach"
            value={selected}
            onChange={setSelected}
          />
          <Button className="mt-4" onClick={() => window.alert(`Selected: ${selected ?? 'none'}`)}>
            Submit choice
          </Button>
        </PracticeQuestionCard>
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
