export interface ZodIssueLike {
  readonly path?: unknown;
  readonly message?: unknown;
}

export interface ZodErrorLike {
  readonly issues?: unknown;
}

const isPathSegment = (segment: unknown): segment is string | number =>
  typeof segment === 'string' || typeof segment === 'number';

const normalisePath = (path: unknown): string => {
  if (!Array.isArray(path)) {
    return '';
  }

  const segments: string[] = [];
  for (const segment of path) {
    if (!isPathSegment(segment)) {
      continue;
    }
    segments.push(typeof segment === 'number' ? `[${segment}]` : segment);
  }

  return segments.join('.');
};

const isZodIssueLike = (issue: unknown): issue is { readonly path: unknown; readonly message: unknown } =>
  typeof issue === 'object' && issue !== null && 'message' in issue;

export const isZodErrorLike = (value: unknown): value is { readonly issues: ReadonlyArray<unknown> } =>
  typeof value === 'object' && value !== null && Array.isArray((value as ZodErrorLike).issues);

export interface MapZodErrorOptions {
  readonly collapseOptionsPath?: boolean;
  readonly fallbackFormMessage?: string;
}

export const mapZodErrorIssues = (value: unknown, options: MapZodErrorOptions = {}): Record<string, string> => {
  if (!isZodErrorLike(value)) {
    return {};
  }

  const entries: Record<string, string> = {};
  const { collapseOptionsPath = false, fallbackFormMessage = 'Submission failed' } = options;

  for (const rawIssue of value.issues) {
    if (!isZodIssueLike(rawIssue)) {
      continue;
    }

    const message = rawIssue.message;
    if (typeof message !== 'string' || message.length === 0) {
      continue;
    }

    const path = normalisePath((rawIssue as { path: unknown }).path);
    const key = collapseOptionsPath && path.startsWith('options') ? 'options' : path.length > 0 ? path : 'form';

    if (!entries[key]) {
      entries[key] = message;
    }
  }

  if (!entries.form && Object.keys(entries).length === 0) {
    entries.form = fallbackFormMessage;
  }

  return entries;
};
