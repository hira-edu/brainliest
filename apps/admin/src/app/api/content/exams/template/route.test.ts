import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateExamTemplateMock = vi.fn();
const getAdminActorMock = vi.fn();

vi.mock('@brainliest/shared', () => ({
  CURRENT_EXAM_TEMPLATE_VERSION: '2025.10',
}));

vi.mock('@/lib/exam-import', () => ({
  generateExamTemplate: generateExamTemplateMock,
}));

vi.mock('@/lib/auth', () => ({
  getAdminActor: getAdminActorMock,
}));

describe('GET /api/content/exams/template', () => {
  beforeEach(() => {
    generateExamTemplateMock.mockReset();
    getAdminActorMock.mockReset();
    getAdminActorMock.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  });

  it('returns a downloadable exam template', async () => {
    const template = {
      version: '2025.10',
      exam: {
        slug: 'algebra-midterm',
        title: 'Algebra Midterm',
      },
      questions: [],
    } as const;
    generateExamTemplateMock.mockReturnValueOnce(template);

    const { GET } = await import('./route');

    const response = await GET();

    expect(generateExamTemplateMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="exam-template-2025.10.json"'
    );

    const bodyText = await response.text();
    expect(JSON.parse(bodyText)).toEqual(template);
  });

  it('returns 401 when unauthenticated', async () => {
    getAdminActorMock.mockResolvedValueOnce(null);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
  });
});
