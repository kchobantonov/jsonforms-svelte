import {
  toButtonSemanticColor,
  type ButtonSemanticColor,
} from "@chobantonov/jsonforms-svelte-extended";

export const semanticColorClassMap: Record<ButtonSemanticColor, string> = {
  primary: "preset-filled-primary-500",
  secondary: "preset-outlined",
  alternative: "preset-tonal",
  success: "preset-filled-success-500",
  warning: "preset-filled-warning-500",
  error: "preset-filled-error-500",
};

export const mapButtonColorToSkeletonClass = (color: unknown) => {
  const semanticColor = toButtonSemanticColor(color);
  return semanticColor ? semanticColorClassMap[semanticColor] : "preset-filled";
};
