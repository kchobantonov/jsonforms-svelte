import type { Component, Snippet } from 'svelte';
export interface DetailDialogProps {
  path: string;
  schema: import('@jsonforms/core').JsonSchema;
  options?: Record<string, unknown>;
  dialogOptions?: Record<string, unknown>;
  allowRemove?: boolean;
  /** Owner of optional destructive draft actions inside this dialog. */
  confirmationCatalogId?: import('../interaction/confirmation').ConfirmationCatalogId;
  inspectable?: boolean;
  triggerLabel?: string;
  /** External navigation can return focus to its own visible action. */
  returnFocus?: HTMLElement;
  beforeOpen?: () => boolean;
  label: string;
  /** Dialog heading; defaults to the action label. */
  title?: string;
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
    typeof import('../core/jsonFormsCompositions.svelte').useJsonFormsControlWithDetail
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

export function tupleActionAttributes(
  label: string,
  ariaLabel: string | undefined,
  selected: boolean,
) {
  return {
    'aria-label': ariaLabel ?? label,
    title: label,
    'data-delete-selected': selected ? '' : undefined,
  };
}

export function clearActionAttributes(label: string, onclick: () => void) {
  return {
    kind: 'delete' as const,
    ariaLabel: label,
    label,
    onmousedown: (event: MouseEvent) => event.preventDefault(),
    onclick,
  };
}
