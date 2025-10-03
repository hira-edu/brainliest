/*
 * Stub generator operates on shared types that Next.js lint treats as `any` without full project context.
 * Disable the unsafe-operation rules for this helper; the data is fully typed via shared packages.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

import type { ExplanationDto, ExplanationRequest, QuestionModel } from '@brainliest/shared';

function summarizeSelection(question: QuestionModel, selectedChoiceIds: string[]): string {
  const selected = question.options
    .filter((option) => selectedChoiceIds.includes(option.id))
    .map((option) => option.label)
    .join(', ');
  return selected || 'an unknown option';
}

function isSelectionCorrect(question: QuestionModel, selectedChoiceIds: string[]): boolean {
  return selectedChoiceIds.some((id) => question.correctChoiceIds.includes(id));
}

export function buildStubExplanation(request: ExplanationRequest): ExplanationDto {
  const selectedLabels = summarizeSelection(request.question, request.selectedChoiceIds);
  const isCorrect = isSelectionCorrect(request.question, request.selectedChoiceIds);

  return {
    summary: isCorrect
      ? 'Great job — that derivative matches the power rule exactly.'
      : `Selected answer (${selectedLabels}) misses the factor introduced when differentiating x^3.`,
    keyPoints: [
      'Apply the power rule: d/dx[x^n] = n·x^{n-1}',
      'Differentiate x^3 to get 3x^2',
      'Check the exponent and coefficient against the original expression',
    ],
    steps: [
      'Identify f(x) = x^3 and note the exponent n = 3.',
      'Apply the power rule to obtain 3x^{2}.',
      'Plug the derivative back into the context of the question to confirm the result.',
    ],
    relatedConcepts: ['Power rule', 'Polynomial derivatives'],
    confidence: 'medium',
  };
}
