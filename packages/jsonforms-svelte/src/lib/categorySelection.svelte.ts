import { untrack } from 'svelte';
import type { UISchemaElement } from '@jsonforms/core';

interface CategoryState {
  readonly visible: boolean;
  readonly uischema: UISchemaElement;
}

/** Selection belongs to a category identity, never to its filtered position. */
export function useCategorySelection<T extends CategoryState>(
  source: {
    readonly categories: T[];
    readonly initial: unknown;
    readonly collapsed?: boolean;
  },
  closable = false,
) {
  const entries = $derived(
    source.categories
      .map((category, index) => {
        const name = (category.uischema as UISchemaElement & { name?: unknown }).name;
        return {
          category,
          key: typeof name === 'string' && name.length ? `name:${name}` : `index:${index}`,
        };
      })
      .filter(({ category }) => category.visible),
  );
  const initialKey = () => {
    const initial = source.initial;
    const match =
      typeof initial === 'string' && initial.length
        ? entries.find((entry) => entry.key === `name:${initial}`)
        : undefined;
    if (typeof initial === 'string' && initial.length && !match) {
      console.warn(
        `Categorization: options.initial "${initial}" matches no visible category; opening the first one instead.`,
      );
    }
    return match?.key ?? entries[0]?.key;
  };
  // Selection must remember visibility fallback, not recompute from the initial option.
  let selected = $state<string | null | undefined>(
    untrack(() => (closable && source.collapsed && !source.initial ? null : initialKey())),
  );
  let previousCollapsed = untrack(() => source.collapsed);
  $effect(() => {
    const collapsed = source.collapsed;
    if (collapsed !== previousCollapsed) {
      previousCollapsed = collapsed;
      if (closable) selected = collapsed ? null : entries[0]?.key;
    }
  });
  const active = $derived(entries.findIndex(({ key }) => key === selected));
  const index = $derived(selected === null ? -1 : active >= 0 ? active : entries.length ? 0 : -1);
  $effect(() => {
    // Persist fallback so a previously hidden selection does not spring back.
    if (selected !== null) selected = entries[index]?.key;
  });
  return {
    get entries() {
      return entries;
    },
    get categories() {
      return entries.map(({ category }) => category);
    },
    get index() {
      return index;
    },
    get key() {
      return entries[index]?.key ?? '';
    },
    select(index: number) {
      if (entries[index]) selected = entries[index].key;
    },
    close() {
      if (closable) selected = null;
    },
    selectKey(key: string | undefined) {
      if (!key && closable) {
        selected = null;
        return;
      }
      if (entries.some((entry) => entry.key === key)) selected = key;
    },
  };
}
