export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type InputState = 'default' | 'error' | 'success';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
