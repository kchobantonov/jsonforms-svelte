import type { UISchemaElement } from '@jsonforms/core';
import { getContext, setContext } from 'svelte';

const context = Symbol('object detail dispatch');
type Dispatch = { uischema: UISchemaElement; path: string };
type Ancestor = { current: () => Dispatch; parent?: Ancestor };

/** Guard the resolved element before presentation clones it. The same registry
 * entry is valid in sibling forms and at different nested data paths. */
export function useUiSchemaCycleGuard(current: () => Dispatch) {
  const parent = getContext<Ancestor | undefined>(context);
  setContext<Ancestor>(context, { current, parent });
  return {
    get cycle() {
      const value = current();
      for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
        const previous = ancestor.current();
        if (previous.path === value.path && previous.uischema === value.uischema) return true;
      }
      return false;
    },
  };
}
