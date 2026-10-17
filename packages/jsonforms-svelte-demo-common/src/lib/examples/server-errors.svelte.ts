import type { ErrorObject } from 'ajv';
import type { Translator } from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { untrack } from 'svelte';
import type { DemoActionEvent } from './actions';

/** JSON Pointer lookup preserves literal dots, slashes, empty and prototype-looking keys. */
export function serverErrorSubject(data: unknown, pointer: string): unknown {
  if (pointer === '') return data;
  if (!pointer.startsWith('/') || /~(?:[^01]|$)/.test(pointer)) return undefined;
  let value = data;
  for (const encoded of pointer.slice(1).split('/')) {
    const key = encoded.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

interface Binding {
  readonly example: string | undefined;
  readonly data: unknown;
  readonly translate: Translator | undefined;
}

/** Host-only simulated server responses for the canonical additional-errors demo. */
export function useDemoServerErrors(binding: Binding) {
  let entries = $state.raw<{ error: ErrorObject; subject: unknown }[]>([]);
  $effect(() => {
    void binding.example;
    entries = [];
  });
  $effect(() => {
    const data = binding.data;
    const previous = untrack(() => entries);
    const next = previous.filter(({ error, subject }) =>
      isEqual(subject, serverErrorSubject(data, error.instancePath)),
    );
    if (next.length !== previous.length) entries = next;
  });
  return {
    get errors(): ErrorObject[] {
      return entries.map(({ error }) => {
        const key = error.params.i18n;
        return typeof key === 'string'
          ? { ...error, message: binding.translate?.(key, error.message) ?? error.message }
          : error;
      });
    },
    handle(event: DemoActionEvent): void {
      if (binding.example !== 'spec-additional-errors') return;
      if (event.action === 'clearServer') entries = [];
      if (event.action !== 'reportServer' || !Array.isArray(event.params.errors)) return;
      entries = event.params.errors
        .filter(
          (error): error is ErrorObject =>
            !!error &&
            typeof error === 'object' &&
            typeof error.instancePath === 'string' &&
            typeof error.keyword === 'string' &&
            typeof error.schemaPath === 'string' &&
            !!error.params &&
            typeof error.params === 'object',
        )
        .map((error) => ({
          error: cloneDeep(error),
          subject: cloneDeep(serverErrorSubject(binding.data, error.instancePath)),
        }));
    },
  };
}
