/*
 * Shared question fixture is used in both server and client contexts. Disable unsafe-assignment rule
 * because branded ID casts are required when importing types across workspace boundaries.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { QuestionModel } from '@brainliest/shared';

export const SAMPLE_QUESTION: QuestionModel = {
  id: 'sample-question-1' as QuestionModel['id'],
  examSlug: 'a-level-math' as QuestionModel['examSlug'],
  subjectSlug: 'mathematics' as QuestionModel['subjectSlug'],
  type: 'single',
  difficulty: 'MEDIUM',
  stemMarkdown: 'What is the derivative of $f(x) = x^3$?',
  hasKatex: true,
  options: [
    { id: 'choice-a', label: 'A', contentMarkdown: '$3x^2$' },
    { id: 'choice-b', label: 'B', contentMarkdown: '$x^2$' },
    { id: 'choice-c', label: 'C', contentMarkdown: '$3x$' },
    { id: 'choice-d', label: 'D', contentMarkdown: '$x^3$' },
  ],
  correctChoiceIds: ['choice-a'],
  explanationMarkdown: 'Differentiate using the power rule: f\'(x) = 3x^2.',
  source: 'Demo fixture',
  year: 2024,
  currentVersionId: 'sample-question-1-v1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const SAMPLE_CHOICES = [
  {
    value: 'choice-a',
    label: 'Option A — 3x²',
    description: 'Correct derivative using the power rule.',
  },
  {
    value: 'choice-b',
    label: 'Option B — x²',
    description: 'Misses the coefficient introduced by the derivative.',
  },
  {
    value: 'choice-c',
    label: 'Option C — 3x',
    description: 'Derivative of x², not x³.',
  },
  {
    value: 'choice-d',
    label: 'Option D — x³',
    description: 'Original function, not its derivative.',
  },
] as const;
