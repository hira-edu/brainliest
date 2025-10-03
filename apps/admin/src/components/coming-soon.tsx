import { EmptyState, Icon } from '@brainliest/ui';
import type { IconName } from '@brainliest/ui';

export interface ComingSoonProps {
  readonly title: string;
  readonly description: string;
  readonly icon?: IconName;
  readonly action?: React.ReactNode;
}

export function ComingSoon({ title, description, icon = 'Hammer', action }: ComingSoonProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<Icon name={icon} className="h-10 w-10" aria-hidden="true" />}
      action={action}
    />
  );
}
