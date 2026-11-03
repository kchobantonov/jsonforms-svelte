import { getContext } from 'svelte';
import { resolveTemporalDataBounds } from './temporalOptions';
import type { JsonSchema } from '@jsonforms/core';

/** Preserve the original document path through nested literal-key editors. */
export const LiteralDataContextSymbol = Symbol('jsonforms-literal-data-context');
/** Internal hint for renderer testers after a literal control is isolated. */
export const LiteralControlScopeSymbol = Symbol('jsonforms-literal-control-scope');

export interface LiteralDataContext {
  rootData: () => unknown;
  rootSchema?: () => JsonSchema | undefined;
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
