'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@brainliest/ui';

interface ExamTemplateActionsProps {
  readonly className?: string;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ExamImportSuccessPayload {
  readonly examSlug?: string;
  readonly questionCount?: number;
}

interface ExamImportErrorPayload {
  readonly error?: unknown;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const parseImportSuccess = (payload: unknown): ExamImportSuccessPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return {};
  }

  const data = payload as ExamImportSuccessPayload;
  const examSlug = typeof data.examSlug === 'string' ? data.examSlug : undefined;
  const questionCount =
    typeof data.questionCount === 'number' && Number.isFinite(data.questionCount)
      ? data.questionCount
      : undefined;

  return { examSlug, questionCount };
};

const parseImportError = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const message = (payload as ExamImportErrorPayload).error;
  return typeof message === 'string' ? message : null;
};

export function ExamTemplateActions({ className }: ExamTemplateActionsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async () => {
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    input.value = '';

    try {
      setStatus('loading');
      setMessage(null);
      const contents = await file.text();
      const response = await fetch('/api/content/exams/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: contents,
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(parseImportError(payload) ?? 'Import failed');
      }

      const result = parseImportSuccess(payload);
      setStatus('success');
      setMessage(`Imported exam “${result.examSlug ?? file.name}” with ${result.questionCount ?? 0} questions.`);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        console.error(error);
      }
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to import exam template.');
    }
  }, []);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <a href="/api/content/exams/template" download>
            Download JSON template
          </a>
        </Button>
        <Button type="button" size="sm" onClick={handleSelectFile} disabled={status === 'loading'}>
          Import exam JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={() => {
            void handleFileChange();
          }}
        />
      </div>
      {message ? (
        <p
          className={
            status === 'error'
              ? 'mt-2 text-sm text-red-600'
              : status === 'success'
                ? 'mt-2 text-sm text-green-600'
                : 'mt-2 text-sm text-gray-600'
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
