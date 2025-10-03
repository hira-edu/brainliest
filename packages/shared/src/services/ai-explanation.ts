import { ANALYTICS_EVENTS, track } from '../analytics';
import type { QuestionModel } from '../domain';
import {
  type ExplanationDto,
  type ExplanationRequest,
  generateExplanation as defaultGenerateExplanation,
} from '../adapters/ai/explain-question';
import {
  type RateLimitResult,
  checkAiRateLimit as defaultRateLimiter,
} from '../adapters/redis/rate-limiter';
import type { RequestExplanationInput } from '../schemas';

export class AiExplanationServiceError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export class AiExplanationDependencyError extends AiExplanationServiceError {
  constructor(message: string) {
    super(message, 'AI_EXPLANATION_DEPENDENCY');
  }
}

export class AiExplanationRateLimitError extends AiExplanationServiceError {
  public readonly remaining: number;

  constructor(message: string, remaining: number) {
    super(message, 'AI_EXPLANATION_RATE_LIMIT');
    this.remaining = remaining;
  }
}

export class AiExplanationQuestionNotFoundError extends AiExplanationServiceError {
  constructor(questionId: string) {
    super(`Question ${questionId} not found`, 'AI_EXPLANATION_QUESTION_NOT_FOUND');
  }
}

export interface AiExplanationDependencies {
  fetchQuestion: (questionId: string) => Promise<QuestionModel | null>;
  generateExplanation?: (request: ExplanationRequest) => Promise<ExplanationDto>;
  rateLimit?: (identifier: string) => Promise<RateLimitResult>;
}

interface InternalDependencies {
  fetchQuestion: AiExplanationDependencies['fetchQuestion'];
  generateExplanation: NonNullable<AiExplanationDependencies['generateExplanation']>;
  rateLimit: NonNullable<AiExplanationDependencies['rateLimit']>;
}

let dependencies: InternalDependencies | null = null;

export function configureAiExplanationService(config: AiExplanationDependencies): void {
  dependencies = {
    fetchQuestion: config.fetchQuestion,
    generateExplanation: config.generateExplanation ?? defaultGenerateExplanation,
    rateLimit: config.rateLimit ?? defaultRateLimiter,
  };
}

export interface RequestAiExplanationOptions extends RequestExplanationInput {
  userId: string;
  rateLimitIdentifier?: string;
}

export interface AiExplanationResponse {
  explanation: ExplanationDto;
  rateLimit: RateLimitResult;
}

export async function requestAiExplanation(
  options: RequestAiExplanationOptions
): Promise<AiExplanationResponse> {
  if (!dependencies) {
    throw new AiExplanationDependencyError('AI explanation service not configured');
  }

  const { fetchQuestion, generateExplanation, rateLimit } = dependencies;

  const identifier = options.rateLimitIdentifier ?? options.userId;
  if (!identifier) {
    throw new AiExplanationDependencyError('rate limit identifier missing');
  }

  const rateLimitResult = await rateLimit(identifier);
  if (!rateLimitResult.allowed) {
    throw new AiExplanationRateLimitError('Too many explanation requests', rateLimitResult.remaining);
  }

  const question = await fetchQuestion(options.questionId);
  if (!question) {
    throw new AiExplanationQuestionNotFoundError(options.questionId);
  }

  const explanation = await generateExplanation({
    question,
    selectedChoiceIds: [...options.selectedChoiceIds],
    userId: options.userId,
    locale: options.locale,
  });

  try {
    await track({
      eventName: ANALYTICS_EVENTS.EXPLANATION_REQUESTED,
      userId: options.userId,
      timestamp: Date.now(),
      properties: {
        questionId: question.id,
        rateRemaining: rateLimitResult.remaining,
        locale: options.locale ?? 'en',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ai-explanation] analytics tracking failed', error);
    }
  }

  return {
    explanation,
    rateLimit: rateLimitResult,
  };
}
