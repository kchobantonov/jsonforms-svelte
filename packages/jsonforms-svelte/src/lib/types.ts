import type { JsonFormsCore } from '@jsonforms/core';

export type JsonFormsChangeEvent = Pick<JsonFormsCore, 'data' | 'errors'>;

export type MaybeReadonly<T> = T | Readonly<T>;

export const JsonFormsContextSymbol = Symbol.for('jsonforms');
export const DispatchContextSymbol = Symbol.for('dispatch');
