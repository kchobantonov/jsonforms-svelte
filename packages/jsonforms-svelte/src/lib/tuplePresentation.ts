import type { Component, Snippet } from 'svelte';
export interface DetailDialogProps {
  path: string;
  schema: import('@jsonforms/core').JsonSchema;
  options?: Record<string, any>;
  allowRemove?: boolean;
  label: string;
  enabled: boolean;
  children: Snippet;
}
export interface TupleActionProps {
  label: string;
  disabled?: boolean;
  kind?: 'add' | 'delete' | 'empty' | 'remove';
  onclick: () => void;
}
export interface AdditionalItemsProps {
  binding: ReturnType<
    typeof import('./jsonFormsCompositions.svelte').useJsonFormsControlWithDetail
  >;
  definition: NonNullable<ReturnType<typeof import('./tuple').tupleDefinition>>;
  renderItem: Snippet<[number]>;
}
export interface TuplePresentation {
  AdditionalItems: Component<AdditionalItemsProps>;
  Dialog: Component<DetailDialogProps>;
  Action: Component<TupleActionProps>;
}
export const TuplePresentationSymbol = Symbol.for('jsonforms:tuplePresentation');
