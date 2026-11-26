import {
  toButtonSemanticColor,
  type ButtonSemanticColor,
} from '@chobantonov/jsonforms-svelte-extended';

type FlowbiteButtonColor = 'primary' | 'secondary' | 'alternative' | 'green' | 'yellow' | 'red';

const semanticColorMap: Record<ButtonSemanticColor, FlowbiteButtonColor> = {
  primary: 'primary',
  secondary: 'secondary',
  alternative: 'alternative',
  success: 'green',
  warning: 'yellow',
  error: 'red',
};

export const mapButtonColorToFlowbiteColor = (color: unknown) => {
  const semanticColor = toButtonSemanticColor(color);
  return semanticColor ? semanticColorMap[semanticColor] : undefined;
};
