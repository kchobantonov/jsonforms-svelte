import {
  toButtonSemanticColor,
  type ButtonSemanticColor,
} from '@chobantonov/jsonforms-svelte-extended';
import type { ButtonVariant } from '@jsonforms-svelte-shadcn-ui/button';

// Match the React shadcn reference through native variants, including their focus/dark styles.
const variants: Record<ButtonSemanticColor, ButtonVariant> = {
  primary: 'default',
  secondary: 'outline',
  alternative: 'secondary',
  success: 'default',
  warning: 'outline',
  error: 'destructive',
};

export const mapButtonColorToShadcnVariant = (color: unknown): ButtonVariant => {
  const semanticColor = toButtonSemanticColor(color);
  return semanticColor ? variants[semanticColor] : 'default';
};
