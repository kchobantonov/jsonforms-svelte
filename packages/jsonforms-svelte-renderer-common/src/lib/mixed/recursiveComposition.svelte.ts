import { createDefaultValue, type JsonSchema } from '@jsonforms/core';
import { getContext, setContext } from 'svelte';

const context = Symbol('recursive composition');
type Entry = { current: () => { schema: JsonSchema; path: string }; parent?: Entry };

/** A repeated schema at a deeper data path is a recursive editor. Its absent
 * child must be created by a user action, never by rendering another form. */
export function useRecursiveComposition(current: () => { schema: JsonSchema; path: string }) {
  const parent = getContext<Entry | undefined>(context);
  setContext<Entry>(context, { current, parent });
  return {
    get repeated() {
      const value = current();
      for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
        const previous = ancestor.current();
        if (previous.schema === value.schema && previous.path !== value.path) return true;
      }
      return false;
    },
  };
}

export function createMissingObject(binding: {
  control: {
    data?: unknown;
    enabled: boolean;
    visible: boolean;
    readonly?: boolean;
    path: string;
    schema: JsonSchema;
    rootSchema: JsonSchema;
  };
  handleChange(path: string, value: unknown): void;
}) {
  const { control } = binding;
  if (control.data === undefined && control.enabled && control.visible && !control.readonly) {
    binding.handleChange(control.path, createDefaultValue(control.schema, control.rootSchema));
  }
}
