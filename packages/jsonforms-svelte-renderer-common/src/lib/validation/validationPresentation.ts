import type { ErrorObject } from 'ajv';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface ValidationIconProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  errors: ErrorObject[];
  showCount?: boolean;
}

export interface ValidationBadgeProps {
  errors: ErrorObject[];
  border?: boolean;
  showCount?: boolean;
  color?: 'error' | 'warning' | 'surface';
  children?: Snippet;
  [key: string]: unknown;
}

export interface ValidationPopoverProps<Attributes = Record<string, unknown>> {
  visible: boolean;
  errors: ErrorObject[];
  triggerContent: Snippet;
  fallback?: Snippet;
  single?: boolean;
  container?: boolean;
  optionalContext?: boolean;
  attributes?: Attributes;
}
