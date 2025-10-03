import { describe, expect, it } from 'vitest';
import { explanationDtoSchema, requestExplanationSchema } from './explanation';

describe('requestExplanationSchema', () => {
  it('parses minimal payload and defaults locale to en', () => {
    const payload = requestExplanationSchema.parse({
      questionId: 'question-123',
      selectedChoiceIds: ['A'],
    });

    expect(payload.locale).toBe('en');
  });

  it('rejects invalid locale', () => {
    const result = requestExplanationSchema.safeParse({
      questionId: 'question-123',
      selectedChoiceIds: ['A'],
      locale: 'english',
    });

    expect(result.success).toBe(false);
  });
});

describe('explanationDtoSchema', () => {
  it('validates explanation format', () => {
    const explanation = explanationDtoSchema.parse({
      summary: 'Short summary',
      keyPoints: ['Point 1'],
      steps: ['Step 1'],
      confidence: 'high',
    });

    expect(explanation.summary).toBe('Short summary');
  });
});
