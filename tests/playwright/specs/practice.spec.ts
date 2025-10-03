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

const createMockPracticeSession = () => {
  const question = {
    id: 'question-1',
    examSlug: 'a-level-math',
    subjectSlug: 'mathematics',
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
    source: 'Stub',
    year: 2024,
    currentVersionId: 'question-1-v1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  } as const;

  return {
    session: {
      id: 'session-1',
      status: 'in_progress',
      currentQuestionIndex: 0,
      totalQuestions: 1,
      remainingSeconds: 900,
      flaggedQuestionIds: [] as string[],
      bookmarkedQuestionIds: [] as string[],
    },
    exam: {
      title: 'A-Level Mathematics Mock Paper',
      description: 'Timed practice session covering calculus basics.',
      tags: ['Timed', 'STEM'],
      durationMinutes: 45,
      passingScore: '75%',
      difficultyMix: 'M',
      attemptsAllowed: 'Unlimited',
      totalQuestions: 1,
    },
    questions: [
      {
        questionId: question.id,
        orderIndex: 0,
        selectedAnswers: [] as number[],
        isFlagged: false,
        isBookmarked: false,
        timeSpentSeconds: 0,
        question,
      },
    ],
  };
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/ai/explanations', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(MOCK_EXPLANATION_RESPONSE),
    });
  });

  let sessionResponse = createMockPracticeSession();

  const fulfillSession = async (route: Route, status: number) => {
    await route.fulfill({
      status,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sessionResponse),
    });
  };

  await page.route('**/api/practice/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      sessionResponse = createMockPracticeSession();
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
        default:
          break;
      }
    }

    await fulfillSession(route, 200);
  });
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
    await page.getByRole('button', { name: 'Generate explanation' }).click();

    const explanationCard = page.getByRole('heading', { name: 'AI explanation' });
    await expect(explanationCard).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByText(/Great job/)).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    await page.waitForTimeout(2_000);
    const updatedTimerValue = await timerLabel.textContent();
    expect(updatedTimerValue).not.toBe(initialTimerValue);
  });

  test('allows toggling bookmark and flag state from the navigation panel', async ({ page }) => {
    await page.goto('/practice/a-level-math');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    const bookmarkButton = sidebar.getByRole('button', { name: /Bookmark/ });
    const initialBookmarkLabel = (await bookmarkButton.textContent())?.trim() ?? 'Bookmark';
    const toggledBookmarkLabel = initialBookmarkLabel.includes('Bookmarked') ? 'Bookmark' : 'Bookmarked';

    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveText(toggledBookmarkLabel);

    const flagButton = sidebar.getByRole('button', { name: /(Flag question|Flagged)/ });
    const initialFlagLabel = (await flagButton.textContent())?.trim() ?? 'Flag question';
    const toggledFlagLabel = initialFlagLabel.includes('Flagged') ? 'Flag question' : 'Flagged';

    await flagButton.click();
    await expect(flagButton).toHaveText(toggledFlagLabel);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: toggledBookmarkLabel })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByRole('button', { name: toggledFlagLabel })).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });

    await page.getByRole('button', { name: toggledBookmarkLabel }).click();
    await expect(page.getByRole('button', { name: initialBookmarkLabel })).toBeVisible();

    await page.getByRole('button', { name: toggledFlagLabel }).click();
    await expect(page.getByRole('button', { name: initialFlagLabel })).toBeVisible();
  });
});
