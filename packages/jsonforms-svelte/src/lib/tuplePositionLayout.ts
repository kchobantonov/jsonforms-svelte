import type { ControlElement, UISchemaElement } from '@jsonforms/core';
import type { Snippet } from 'svelte';

export const TuplePositionLayoutSymbol = Symbol.for('jsonforms:tuplePositionLayout');
export interface TuplePositionLayoutContext {
  count: number;
  renderPosition: Snippet<[number, ControlElement, boolean]>;
}

/** Layout scopes address declared schema positions, never arbitrary data paths. */
export function tuplePositionIndex(scope: unknown, count: number): number | undefined {
  if (typeof scope !== 'string') return undefined;
  const match = /^#\/(?:items|prefixItems)\/(0|[1-9]\d*)$/.exec(scope);
  if (!match) return undefined;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) && index < count ? index : undefined;
}

/** Dialog details inside a position do not place additional tuple positions. */
export function tuplePlacedPositions(layout: UISchemaElement, count: number): Set<number> {
  const placed = new Set<number>();
  const visit = (ui: UISchemaElement) => {
    const index =
      ui.type === 'Control' ? tuplePositionIndex((ui as ControlElement).scope, count) : undefined;
    if (index !== undefined) placed.add(index);
    const elements = (ui as UISchemaElement & { elements?: UISchemaElement[] }).elements;
    elements?.forEach(visit);
  };
  visit(layout);
  return placed;
}
