import { getContext } from 'svelte';
import { resolveTemporalDataBounds } from './temporalOptions';

/** Preserve the original document path through nested literal-key editors. */
export const LiteralDataContextSymbol = Symbol('jsonforms-literal-data-context');

export interface LiteralDataContext {
  rootData: () => unknown;
  segments: () => readonly string[];
}

/** Capture the optional literal editor context during component initialization. */
export function useTemporalDataBounds() {
  const literal = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  return (schema: Record<string, unknown>, path: string, data: unknown) =>
    resolveTemporalDataBounds(
      schema,
      literal ? [...literal.segments(), ...(path ? path.split('.') : [])] : path,
      literal ? literal.rootData() : data,
    );
}
