'use client';

import { Button, Icon, PracticeExplainButton, cn, type PracticeExplainButtonProps } from '@brainliest/ui';

type Props = PracticeExplainButtonProps;

const FallbackExplainButton = ({
  label = 'AI explanation',
  isActive,
  isLoading,
  className,
  ...rest
}: Props) => (
  <Button
    type="button"
    variant="secondary"
    size="sm"
    aria-pressed={isActive}
    isLoading={isLoading}
    className={cn('inline-flex items-center gap-2', className)}
    {...rest}
  >
    <Icon name="Sparkles" size="sm" aria-hidden="true" />
    <span>{label}</span>
  </Button>
);

export const ExplainButton: React.FC<Props> = (props) => {
  if (PracticeExplainButton) {
    return <PracticeExplainButton {...props} />;
  }

  return <FallbackExplainButton {...props} />;
};
