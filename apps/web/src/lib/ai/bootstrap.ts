/*
 * Local bootstrap references workspace packages that Next.js lint treats as `any` without
 * project-aware type resolution. Disable the unsafe-operation rules to avoid false positives.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { configureAiExplanationService, configureQuestionRepository } from '@brainliest/shared';
import {
  drizzleClient,
  DrizzleQuestionRepository,
  DrizzleExplanationRepository,
} from '@brainliest/db';
import { SAMPLE_QUESTION } from './sample-question';
import { mapRecordToQuestionModel } from './map-record-to-question';
import { buildStubExplanation } from './stub-explanation';

const globalState = globalThis as typeof globalThis & {
  __brainliestAiConfigured?: boolean;
};

const questionRepository = new DrizzleQuestionRepository(drizzleClient);
const explanationRepository = new DrizzleExplanationRepository(drizzleClient);

export function ensureAiExplanationBootstrap() {
  if (globalState.__brainliestAiConfigured) {
    return;
  }

  const useStubGenerator = process.env.NEXT_PUBLIC_ENABLE_OPENAI !== 'true';

  configureAiExplanationService({
    fetchQuestion: async (questionId) => {
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

  globalState.__brainliestAiConfigured = true;
}
