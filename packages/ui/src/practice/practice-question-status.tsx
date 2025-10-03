import { Fragment, type ReactNode } from 'react';
import { Alert, type AlertProps } from '../feedback/alert';
import { cn } from '../lib/utils';

export interface PracticeQuestionStatusProps extends AlertProps {
  /**
   * Backwards-compatible message prop for callers that only supply body text.
   * When provided alongside `description` or `children`, `message` is ignored.
   */
  message?: ReactNode;
}

export function PracticeQuestionStatus({
  message,
  variant = 'info',
  description,
  children,
  className,
  title,
  ...rest
}: PracticeQuestionStatusProps) {
  const descriptionFromMessage =
    description ?? (typeof message === 'string' ? message : undefined);

  const contentFromMessage =
    children ??
    (typeof message === 'string' || message === undefined ? null : (
      <Fragment>{message}</Fragment>
    ));

  if (!title && !descriptionFromMessage && !contentFromMessage) {
    return null;
  }

  return (
    <Alert
      variant={variant}
      title={title}
      description={descriptionFromMessage}
      className={cn('shadow-none', className)}
      {...rest}
    >
      {contentFromMessage}
    </Alert>
  );
}
