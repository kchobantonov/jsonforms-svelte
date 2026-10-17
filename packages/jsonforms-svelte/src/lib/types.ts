import type { JsonFormsCore } from '@jsonforms/core';

export type JsonFormsChangeEvent = Pick<JsonFormsCore, 'data' | 'errors'>;

export type MaybeReadonly<T> = T | Readonly<T>;

export const JsonFormsContextSymbol = Symbol.for('jsonforms');
export const DispatchContextSymbol = Symbol.for('dispatch');

/** Host configuration before JSON Forms inserts its own defaults. */
export interface AuthoredConfigContext {
  readonly value: Record<string, unknown> | undefined;
}
export const AuthoredConfigContextSymbol = Symbol.for('jsonforms-svelte.authored-config');

/** True inside a delegated table/grid cell editor. Presentation only. */
export const CellPresentationContextSymbol = Symbol.for('jsonforms-svelte.cell-presentation');
