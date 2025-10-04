import 'server-only';

/*
 * Server-side AI explanation service wiring shares configuration with the client bootstrap,
 * but keeps global setup localized to the server runtime.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

import {
  AiExplanationDependencyError,
  configureAiExplanationService,
  configureQuestionRepository,
  requestAiExplanation,
  type RequestAiExplanationOptions,
} from '@brainliest/shared';
import {
  drizzleClient,
  DrizzleQuestionRepository,
  DrizzleExplanationRepository,
} from '@brainliest/db';
import { mapRecordToQuestionModel } from './map-record-to-question';
import { SAMPLE_QUESTION } from './sample-question';
import { buildStubExplanation } from './stub-explanation';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serverState = globalThis as typeof globalThis & {
  __brainliestServerAiConfigured?: boolean;
};

const questionRepository = new DrizzleQuestionRepository(drizzleClient);
const explanationRepository = new DrizzleExplanationRepository(drizzleClient);

function ensureServerAiConfigured() {
  if (serverState.__brainliestServerAiConfigured) {
    return;
  }

  const useStubGenerator = process.env.OPENAI_API_KEY ? false : true;
  const shouldStubRateLimiter =
    !process.env.REDIS_URL || /localhost|127\.0\.0\.1/.test(process.env.REDIS_URL);

  configureAiExplanationService({
    fetchQuestion: async (questionId) => {
      if (!UUID_PATTERN.test(questionId)) {
        return SAMPLE_QUESTION;
      }

      const record = await questionRepository.findById(questionId);
      if (record) {
        return mapRecordToQuestionModel(record);
      }

      if (process.env.NODE_ENV !== 'production') {
        return SAMPLE_QUESTION;
      }

      return null;
    },
    generateExplanation: useStubGenerator
      ? (request) => Promise.resolve(buildStubExplanation(request))
      : undefined,
    rateLimit: shouldStubRateLimiter
      ? async () => ({ allowed: true, remaining: 5 })
      : undefined,
  });

  configureQuestionRepository(async (payload) => {
    await explanationRepository.create({
      questionId: payload.questionId,
      questionVersionId: payload.questionVersionId,
      answerPattern: payload.answerHash,
      content: payload.contentMarkdown,
      model: payload.model,
      language: payload.language,
      tokensTotal: payload.tokensTotal,
      costCents: payload.costCents,
    });
  });

  serverState.__brainliestServerAiConfigured = true;
}

export function requestServerAiExplanation(
  options: Omit<RequestAiExplanationOptions, 'userId'> & { userId: string }
) {
  ensureServerAiConfigured();
  return requestAiExplanation(options).catch((error) => {
    if (error instanceof AiExplanationDependencyError) {
      serverState.__brainliestServerAiConfigured = false;
      ensureServerAiConfigured();
      return requestAiExplanation(options);
    }
    throw error;
  });
}

export function resetServerAiConfiguration() {
  serverState.__brainliestServerAiConfigured = false;
}
