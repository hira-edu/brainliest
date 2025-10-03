import { beforeEach, describe, expect, it, vi } from 'vitest';

class MockZodError extends Error {
  public readonly issues: unknown[];

  constructor(issues: unknown[] = []) {
    super('Mock Zod Error');
    this.issues = issues;
  }
}

const importExamTemplateMock = vi.fn();

vi.mock('@brainliest/shared', () => ({
  ZodError: MockZodError,
}));

vi.mock('@/lib/exam-import', () => ({
  importExamTemplate: importExamTemplateMock,
}));

describe('POST /api/content/exams/import', () => {
  beforeEach(() => {
    importExamTemplateMock.mockReset();
  });

  it('imports an exam template and returns the created slug', async () => {
    const payload = { version: '2025.10', exam: { slug: 'algebra-midterm' }, questions: [] };
    importExamTemplateMock.mockResolvedValueOnce({ examSlug: 'algebra-midterm', questionCount: 0 });

    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(importExamTemplateMock).toHaveBeenCalledWith(payload);

    const body = (await response.json()) as {
      success: boolean;
      examSlug?: string;
      questionCount?: number;
    };

    expect(body).toEqual({ success: true, examSlug: 'algebra-midterm', questionCount: 0 });
  });

  it('returns 400 when the payload cannot be parsed as JSON', async () => {
    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(importExamTemplateMock).not.toHaveBeenCalled();

    const body = (await response.json()) as { success: boolean; error: string };
    expect(body).toEqual({ success: false, error: 'Invalid JSON payload.' });
  });

  it('returns validation issues when the template schema fails', async () => {
    const issues = [
      { path: ['exam', 'slug'], message: 'Slug is required.' },
    ];
    importExamTemplateMock.mockRejectedValueOnce(new MockZodError(issues));

    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = (await response.json()) as {
      success: boolean;
      error: string;
      issues?: unknown;
    };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Template validation failed.');
    expect(body.issues).toEqual(issues);
  });

  it('returns 409 when the exam already exists', async () => {
    importExamTemplateMock.mockRejectedValueOnce(
      new Error('Exam with slug "algebra-midterm" already exists.')
    );

    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '2025.10' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/already exists/);
  });

  it('returns 500 for unexpected errors', async () => {
    importExamTemplateMock.mockRejectedValueOnce(new Error('Database offline'));

    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '2025.10' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Database offline');
  });

  it('returns a generic error when the rejection is not an Error instance', async () => {
    importExamTemplateMock.mockRejectedValueOnce('catastrophic failure');

    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/content/exams/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '2025.10' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unexpected error importing exam.');
  });
});
