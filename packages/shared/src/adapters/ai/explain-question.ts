import { createHash } from 'crypto';
import { OpenAI } from 'openai';
import type { CompletionUsage } from 'openai/resources/chat/completions';
import type { QuestionModel } from '../../domain';
import { env } from '@brainliest/config/env.server';
import { REDIS_TTL, redisKeys } from '@brainliest/config/redis-keys';
import { redis } from '../redis';

export interface ExplanationRequest {
  question: QuestionModel;
  selectedChoiceIds: string[];
  userId: string;
  locale?: string;
}

export interface ExplanationDto {
  summary: string;
  keyPoints: string[];
  steps: string[];
  relatedConcepts?: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface QuestionRepository {
  saveExplanation(input: {
    questionId: string;
    questionVersionId: string;
    answerHash: string;
    model: string;
    language: string;
    contentMarkdown: string;
    tokensTotal: number;
    costCents: number;
  }): Promise<void>;
}

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a concise, rigorous exam tutor. Explain answers step by step using only the provided question, choices, and correct answer.
Prefer formulas, definitions, and contrasts. Keep under 180 words. Use KaTeX-compatible LaTeX for math.
If the user-selected answer is wrong, briefly contrast with the correct one. If context is insufficient, say so and stop.`;

const EXPLANATION_FUNCTION_SCHEMA = {
  name: 'provide_explanation',
  description: 'Generate a structured explanation for an exam question.',
  parameters: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      steps: { type: 'array', items: { type: 'string' } },
      relatedConcepts: { type: 'array', items: { type: 'string' } },
      confidence: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
      },
    },
    required: ['summary', 'keyPoints', 'steps', 'confidence'],
  },
} as const;

let questionRepositorySave: QuestionRepository['saveExplanation'] | null = null;

export function configureQuestionRepository(handler: QuestionRepository['saveExplanation']) {
  questionRepositorySave = handler;
}

export async function generateExplanation(request: ExplanationRequest): Promise<ExplanationDto> {
  const { question, selectedChoiceIds, locale = 'en' } = request;

  const answerHash = hashAnswers(selectedChoiceIds);
  const cacheKey = redisKeys.aiExplanation(question.id, answerHash, 'gpt-4-turbo', locale);

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as ExplanationDto;
  }

  const prompt = buildPrompt(question, selectedChoiceIds);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    functions: [EXPLANATION_FUNCTION_SCHEMA],
    function_call: { name: 'provide_explanation' },
    temperature: 0.3,
  });

  const functionCall = response.choices[0]?.message?.function_call;
  if (!functionCall?.arguments) {
    throw new Error('No function call in OpenAI response');
  }

  const explanation = JSON.parse(functionCall.arguments) as ExplanationDto;

  await redis.setex(cacheKey, REDIS_TTL.AI_EXPLANATION, JSON.stringify(explanation));

  if (!questionRepositorySave) {
    throw new Error('Question repository not configured');
  }

  await questionRepositorySave({
    questionId: question.id,
    questionVersionId: question.currentVersionId,
    answerHash,
    model: 'gpt-4-turbo',
    language: locale,
    contentMarkdown: JSON.stringify(explanation),
    tokensTotal: response.usage?.total_tokens ?? 0,
    costCents: calculateCost(response.usage),
  });

  return explanation;
}

function hashAnswers(choiceIds: string[]): string {
  const sorted = [...choiceIds].sort();
  return createHash('sha256').update(sorted.join(',')).digest('hex').slice(0, 16);
}

function buildPrompt(question: QuestionModel, selectedIds: string[]): string {
  const selectedLabels = question.options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label);

  const correctLabels = question.options
    .filter((option) => question.correctChoiceIds.includes(option.id))
    .map((option) => option.label);

  const choices = question.options
    .map((option) => `${option.label}. ${option.contentMarkdown}`)
    .join('\n');

  return `
Context:
- Question: ${question.stemMarkdown}
- Choices: ${choices}
- User selected: ${selectedLabels.join(', ')}
- Correct answer(s): ${correctLabels.join(', ')}
- Subject: ${question.subjectSlug}
- Difficulty: ${question.difficulty}

Task:
Explain the correct answer and reasoning. If user is wrong, contrast succinctly.
  `.trim();
}

function calculateCost(usage?: CompletionUsage): number {
  let totalTokens = 0;

  if (usage && typeof usage === 'object' && 'total_tokens' in usage) {
    const value = (usage as Record<string, unknown>).total_tokens;
    if (typeof value === 'number') {
      totalTokens = value;
    }
  }

  if (totalTokens <= 0) {
    return 0;
  }

  const centsPerToken = 0.002;
  return Math.round(totalTokens * centsPerToken);
}
