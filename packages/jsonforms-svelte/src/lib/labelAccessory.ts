import type { Snippet } from 'svelte';

/** An accessory for the root label of a literal-property editor. */
export const LiteralLabelAccessorySymbol = Symbol.for('jsonforms-svelte:LiteralLabelAccessory');

export interface LiteralLabelAccessory {
  label: string;
  snippet: Snippet | undefined;
}
