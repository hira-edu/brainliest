import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const advanceQuestionMock = vi.fn();
const toggleFlagMock = vi.fn();
const toggleBookmarkMock = vi.fn();
const updateRemainingSecondsMock = vi.fn();
const recordQuestionProgressMock = vi.fn();
const submitAnswerMock = vi.fn();
const revealAnswerMock = vi.fn();
const getSessionMock = vi.fn();

const mapSessionRecordToApiResponseMock = vi.fn();

vi.mock('@brainliest/db', () => ({
  drizzleClient: {},
  DrizzleSessionRepository: class {
    public advanceQuestion = advanceQuestionMock;
    public toggleFlag = toggleFlagMock;
    public toggleBookmark = toggleBookmarkMock;
    public updateRemainingSeconds = updateRemainingSecondsMock;
    public recordQuestionProgress = recordQuestionProgressMock;
    public submitAnswer = submitAnswerMock;
    public revealAnswer = revealAnswerMock;
    public getSession = getSessionMock;
  },
}));

vi.mock('@/lib/practice/mappers', () => ({
  mapSessionRecordToApiResponse: mapSessionRecordToApiResponseMock,
}));

const buildRequest = (body: unknown): NextRequest =>
  new Request('http://localhost/api/practice/sessions/session-123', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;

const buildContext = () => ({ params: Promise.resolve({ sessionId: 'session-123' }) });

describe('PATCH /api/practice/sessions/[sessionId]', () => {
  beforeEach(() => {
    advanceQuestionMock.mockReset();
    toggleFlagMock.mockReset();
    toggleBookmarkMock.mockReset();
    updateRemainingSecondsMock.mockReset();
    recordQuestionProgressMock.mockReset();
    submitAnswerMock.mockReset();
    revealAnswerMock.mockReset();
    getSessionMock.mockReset();
    mapSessionRecordToApiResponseMock.mockReset();
  });

  it('submits an answer and returns the mapped session', async () => {
    const rawSession = { id: 'session-123', metadata: {} } as unknown as Record<string, unknown>;
    const mapped = { session: { id: 'session-123', status: 'in_progress' } };

    submitAnswerMock.mockResolvedValueOnce(undefined);
    getSessionMock.mockResolvedValueOnce(rawSession);
    mapSessionRecordToApiResponseMock.mockReturnValueOnce(mapped);

    const { PATCH } = await import('./route');

    const request = buildRequest({ operation: 'submit-answer', questionId: 'question-789' });
    const response = await PATCH(request, buildContext());

    expect(response.status).toBe(200);
    expect(submitAnswerMock).toHaveBeenCalledWith({
      sessionId: 'session-123',
      questionId: 'question-789',
    });
    expect(getSessionMock).toHaveBeenCalledWith('session-123');
    expect(mapSessionRecordToApiResponseMock).toHaveBeenCalledWith(rawSession);

    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload).toEqual(mapped);
  });

  it('reveals an answer and returns the mapped session', async () => {
    const rawSession = { id: 'session-123', metadata: {} } as unknown as Record<string, unknown>;
    const mapped = { session: { id: 'session-123', status: 'in_progress' } };

    revealAnswerMock.mockResolvedValueOnce(undefined);
    getSessionMock.mockResolvedValueOnce(rawSession);
    mapSessionRecordToApiResponseMock.mockReturnValueOnce(mapped);

    const { PATCH } = await import('./route');

    const request = buildRequest({ operation: 'reveal-answer', questionId: 'question-789' });
    const response = await PATCH(request, buildContext());

    expect(response.status).toBe(200);
    expect(revealAnswerMock).toHaveBeenCalledWith({
      sessionId: 'session-123',
      questionId: 'question-789',
    });
    expect(getSessionMock).toHaveBeenCalledWith('session-123');
    expect(mapSessionRecordToApiResponseMock).toHaveBeenCalledWith(rawSession);

    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload).toEqual(mapped);
  });
});
