import { test, expect, type Route } from '@playwright/test';

const WAIT_FOR_EXPLANATION = 15_000;

const MOCK_EXPLANATION_RESPONSE = {
  explanation: {
    summary: 'Great job — deterministic explanation.',
    confidence: 'high',
    keyPoints: ['Applied the power rule correctly', 'Included the exponent coefficient'],
    steps: ['Differentiate using the power rule', 'Simplify the exponent result'],
  },
  rateLimitRemaining: 5,
};

let mockQuestionCount = 1;

const createMockPracticeQuestion = (index: number) => {
  const optionIds = ['a', 'b', 'c', 'd'] as const;

  return {
    id: `question-${index + 1}`,
    examSlug: 'a-level-math',
    subjectSlug: 'mathematics',
    type: 'single',
    difficulty: 'MEDIUM',
    stemMarkdown: `Question ${index + 1}: What is the derivative of $f(x) = x^3$?`,
    hasKatex: true,
    options: optionIds.map((suffix, optionIndex) => ({
      id: `choice-${suffix}-${index + 1}`,
      label: String.fromCharCode(65 + optionIndex),
      contentMarkdown: optionIndex === 0 ? '$3x^2$' : `$x^{${optionIndex}}$`,
    })),
    correctChoiceIds: [`choice-a-${index + 1}`],
    explanationMarkdown: 'Differentiate using the power rule: f\'(x) = 3x^2.',
    source: 'Stub',
    year: 2024,
    currentVersionId: `question-${index + 1}-v1`,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  } as const;
};

const createMockPracticeSession = (questionCount = 1) => {
  const questions = Array.from({ length: questionCount }, (_, index) => createMockPracticeQuestion(index));

  return {
    session: {
      id: 'session-1',
      status: 'in_progress',
      currentQuestionIndex: 0,
      totalQuestions: questionCount,
      remainingSeconds: 900,
      flaggedQuestionIds: [] as string[],
      bookmarkedQuestionIds: [] as string[],
      submittedQuestionIds: [] as string[],
      revealedQuestionIds: [] as string[],
    },
    exam: {
      title: 'A-Level Mathematics Mock Paper',
      description: 'Timed practice session covering calculus basics.',
      tags: ['Timed', 'STEM'],
      durationMinutes: 45,
      passingScore: '75%',
      difficultyMix: 'M',
      attemptsAllowed: 'Unlimited',
      totalQuestions: questionCount,
    },
    questions: questions.map((question, orderIndex) => ({
      questionId: question.id,
      orderIndex,
      selectedAnswers: [] as number[],
      isFlagged: false,
      isBookmarked: false,
      isSubmitted: false,
      hasRevealedAnswer: false,
      isCorrect: null,
      timeSpentSeconds: 0,
      question,
    })),
  };
};

type MockSessionQuestion = ReturnType<typeof createMockPracticeSession>['questions'][number];

const computeIsCorrect = (question: MockSessionQuestion): boolean | null => {
  const options = question.question.options ?? [];
  const correctIds = new Set(question.question.correctChoiceIds ?? []);

  if (correctIds.size === 0) {
    return null;
  }

  const correctIndices = options
    .map((option, index) => (correctIds.has(option.id) ? index : null))
    .filter((value): value is number => value !== null);

  const selectedSet = new Set(question.selectedAnswers);
  const correctSet = new Set(correctIndices);

  if (selectedSet.size !== correctSet.size) {
    return false;
  }

  for (const value of selectedSet) {
    if (!correctSet.has(value)) {
      return false;
    }
  }

  return true;
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/ai/explanations', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(MOCK_EXPLANATION_RESPONSE),
    });
  });

  let sessionResponse = createMockPracticeSession(mockQuestionCount);

  const fulfillSession = async (route: Route, status: number) => {
    await route.fulfill({
      status,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sessionResponse),
    });
  };

  await page.route('**/api/practice/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      sessionResponse = createMockPracticeSession(mockQuestionCount);
      await fulfillSession(route, 201);
      return;
    }

    await fulfillSession(route, 200);
  });

  await page.route('**/api/practice/sessions/*', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillSession(route, 200);
      return;
    }

    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON() as
        | {
            operation: 'toggle-flag' | 'toggle-bookmark';
            questionId: string;
            flagged?: boolean;
            bookmarked?: boolean;
          }
        | {
            operation: 'record-answer';
            questionId: string;
            selectedAnswers: number[];
            timeSpentSeconds?: number | null;
          }
        | { operation: 'update-timer'; remainingSeconds: number }
        | { operation: 'advance'; currentQuestionIndex: number }
        | { operation: 'submit-answer'; questionId: string }
        | { operation: 'reveal-answer'; questionId: string }
        | undefined;

      if (!payload) {
        await fulfillSession(route, 200);
        return;
      }

      switch (payload.operation) {
        case 'toggle-flag': {
          const flagged = new Set(sessionResponse.session.flaggedQuestionIds);
          if (payload.flagged) {
            flagged.add(payload.questionId);
          } else {
            flagged.delete(payload.questionId);
          }
          sessionResponse.session.flaggedQuestionIds = Array.from(flagged);
          sessionResponse.questions = sessionResponse.questions.map((question) =>
            question.questionId === payload.questionId
              ? { ...question, isFlagged: Boolean(payload.flagged) }
              : question
          );
          break;
        }
        case 'toggle-bookmark': {
          const bookmarked = new Set(sessionResponse.session.bookmarkedQuestionIds);
          if (payload.bookmarked) {
            bookmarked.add(payload.questionId);
          } else {
            bookmarked.delete(payload.questionId);
          }
          sessionResponse.session.bookmarkedQuestionIds = Array.from(bookmarked);
          sessionResponse.questions = sessionResponse.questions.map((question) =>
            question.questionId === payload.questionId
              ? { ...question, isBookmarked: Boolean(payload.bookmarked) }
              : question
          );
          break;
        }
        case 'record-answer': {
          sessionResponse.questions = sessionResponse.questions.map((question) =>
            question.questionId === payload.questionId
              ? {
                  ...question,
                  selectedAnswers: payload.selectedAnswers ?? [],
                  timeSpentSeconds: payload.timeSpentSeconds ?? question.timeSpentSeconds,
                }
              : question
          );
          break;
        }
        case 'update-timer': {
          sessionResponse.session.remainingSeconds = Math.max(0, Number(payload.remainingSeconds ?? 0));
          break;
        }
        case 'advance': {
          sessionResponse.session.currentQuestionIndex = Math.max(0, Number(payload.currentQuestionIndex ?? 0));
          break;
        }
        case 'submit-answer': {
          const submitted = new Set(sessionResponse.session.submittedQuestionIds ?? []);
          submitted.add(payload.questionId);
          sessionResponse.session.submittedQuestionIds = Array.from(submitted);
          sessionResponse.questions = sessionResponse.questions.map((question) =>
            question.questionId === payload.questionId
              ? {
                  ...question,
                  isSubmitted: true,
                  hasRevealedAnswer: false,
                  isCorrect: computeIsCorrect(question),
                }
              : question
          );
          break;
        }
        case 'reveal-answer': {
          const revealed = new Set(sessionResponse.session.revealedQuestionIds ?? []);
          revealed.add(payload.questionId);
          sessionResponse.session.revealedQuestionIds = Array.from(revealed);
          sessionResponse.questions = sessionResponse.questions.map((question) =>
            question.questionId === payload.questionId
              ? {
                  ...question,
                  hasRevealedAnswer: true,
                }
              : question
          );
          break;
        }
        case 'complete-session': {
          sessionResponse.session.status = 'completed';
          break;
        }
        default:
          break;
      }
    }

    await fulfillSession(route, 200);
  });
});

test.afterEach(() => {
  mockQuestionCount = 1;
});

test.describe('Practice page', () => {
  test('renders session layout, generates explanations, and counts down timer', async ({ page }) => {
    await page.goto('/practice/a-level-math');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'A-Level Mathematics Mock Paper' })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByRole('heading', { name: /Session overview/i })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    const timerLabel = page.getByText(/\d{1,2}:\d{2}/).first();
    const initialTimerValue = await timerLabel.textContent();

    await page.getByRole('radio', { name: 'A' }).click();
    await page.getByRole('button', { name: 'Generate answer explanation' }).click();

    const explanationCard = page.getByRole('heading', { name: 'AI explanation' });
    await expect(explanationCard).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByText(/Great job/)).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    const submitButton = page.getByRole('button', { name: 'Submit answer' });

    await expect(submitButton).toBeEnabled();

    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/Correct answer:/i)).toBeVisible();

    const finishExamButton = page.getByRole('button', { name: 'Finish exam' });
    await expect(finishExamButton).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(finishExamButton).toBeEnabled();

    await finishExamButton.click();
    await expect(page).toHaveURL(/practice\/a-level-math\/summary/);
    await expect(page.getByRole('heading', { name: /Practice summary/i })).toBeVisible();

    await page.waitForTimeout(2_000);
    const updatedTimerValue = await timerLabel.textContent();
    expect(updatedTimerValue).not.toBe(initialTimerValue);
  });

  test('allows toggling question controls and persists state', async ({ page, context }) => {
    // Clear localStorage before navigating
    await context.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/practice/a-level-math');
    await page.waitForLoadState('networkidle');

    const questionExplanationButton = page.getByRole('button', { name: 'Toggle question explanation' });
    await questionExplanationButton.click();
    await expect(page.getByText(/power rule/i)).toBeVisible();

    await page.getByRole('radio', { name: 'A' }).click();

    const submitButtonToggleTest = page.getByRole('button', { name: 'Submit answer' });

    await submitButtonToggleTest.click();

    await expect(page.getByRole('button', { name: 'Finish exam' })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    const bookmarkButton = page.getByRole('button', { name: 'Bookmark question' });
    await bookmarkButton.click();
    await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

    const flagButton = page.getByRole('button', { name: 'Flag question' });
    await flagButton.click();
    await expect(page.getByRole('button', { name: 'Unflag question' })).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByRole('button', { name: 'Unflag question' })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByRole('button', { name: 'Submit answer' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Finish exam' })).toBeVisible();
    await expect(page.getByText(/Correct answer:/i)).toBeVisible();

    await page.getByRole('button', { name: 'Remove bookmark' }).click();
    await expect(page.getByRole('button', { name: 'Bookmark question' })).toBeVisible();

    await page.getByRole('button', { name: 'Unflag question' }).click();
    await expect(page.getByRole('button', { name: 'Flag question' })).toBeVisible();
  });

  test('shows finish exam only on final question', async ({ page }) => {
    mockQuestionCount = 2;

    await page.goto('/practice/a-level-math');
    await page.waitForLoadState('networkidle');

    await page.getByRole('radio', { name: 'A' }).click();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByRole('button', { name: 'Finish exam' })).toHaveCount(0);

    const nextButton = page.locator('main').getByRole('button', { name: 'Next' });
    await nextButton.click();
    await page.waitForTimeout(250);

    await expect(page.getByRole('button', { name: 'Finish exam' })).toHaveCount(0);

    await page.getByRole('radio', { name: 'A' }).click();
    await page.getByRole('button', { name: 'Submit answer' }).click();

    const finishExamButton = page.getByRole('button', { name: 'Finish exam' });
    await expect(finishExamButton).toBeVisible();

    await finishExamButton.click();
    await expect(page).toHaveURL(/practice\/a-level-math\/summary/);
    await expect(page.getByRole('heading', { name: /Practice summary/i })).toBeVisible();
  });
});
