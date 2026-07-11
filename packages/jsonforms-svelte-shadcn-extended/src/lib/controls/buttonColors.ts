import {
  toButtonSemanticColor,
  type ButtonSemanticColor,
} from '@chobantonov/jsonforms-svelte-extended';

export const semanticColorClassMap: Record<ButtonSemanticColor, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'border-border bg-background text-foreground hover:bg-muted',
  alternative: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  success: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
  warning: 'bg-amber-500 text-black hover:bg-amber-500/90',
  error: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
};

export const mapButtonColorToShadcnClass = (color: unknown) => {
  const semanticColor = toButtonSemanticColor(color);
  return semanticColor ? semanticColorClassMap[semanticColor] : semanticColorClassMap.primary;
};
