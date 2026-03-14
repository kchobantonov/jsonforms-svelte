import {
  toButtonSemanticColor,
  type ButtonSemanticColor,
} from "@chobantonov/jsonforms-svelte-extended";

export type FlowbiteButtonColor =
  | "primary"
  | "secondary"
  | "alternative"
  | "green"
  | "yellow"
  | "red";

export const semanticColorMap: Record<ButtonSemanticColor, FlowbiteButtonColor> = {
  primary: "primary",
  secondary: "secondary",
  alternative: "alternative",
  success: "green",
  warning: "yellow",
  error: "red",
};

export const mapButtonColorToFlowbiteColor = (color: unknown) => {
  const semanticColor = toButtonSemanticColor(color);
  return semanticColor ? semanticColorMap[semanticColor] : undefined;
};
