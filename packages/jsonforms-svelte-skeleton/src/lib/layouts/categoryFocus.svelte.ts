import { SvelteSet } from 'svelte/reactivity';
import { tick, untrack } from 'svelte';
import { categoryFocusWasLost } from '@chobantonov/jsonforms-svelte-renderer-common';

export function useNativeCategoryFocus<Entry extends { key: string }>(
  selection: {
    readonly allEntries: Entry[];
    readonly key: string | undefined;
    readonly index: number;
  },
  root: () => HTMLElement | undefined,
  accordion: boolean,
) {
  let nativeEntries = $state.raw(selection.allEntries);
  let nativeKey = $state(selection.key);
  $effect(() => {
    const nextEntries = selection.allEntries;
    const nextKey = selection.key;
    const focusedKey = focusedElement?.matches(':focus')
      ? focusedItem()?.dataset.categoryKey
      : undefined;
    const removingFocused =
      nextEntries.length > 0 &&
      !!focusedKey &&
      untrack(() => nativeEntries.some((entry) => entry.key === focusedKey)) &&
      !nextEntries.some((entry) => entry.key === focusedKey);
    if (!removingFocused) {
      nativeEntries = nextEntries;
      nativeKey = nextKey;
      return;
    }
    const frame = requestAnimationFrame(() => {
      nativeEntries = nextEntries;
      nativeKey = nextKey;
    });
    return () => cancelAnimationFrame(frame);
  });

  let focusedElement: HTMLElement | undefined;
  const focusedItem = () =>
    accordion ? focusedElement?.closest<HTMLElement>('[data-category-key]') : focusedElement;

  let previousKey = untrack(() => nativeKey);
  // Keep a removed trigger for one update while focus moves to the fallback.
  let retainedEntries = $state.raw(untrack(() => nativeEntries));
  let retentionRevision = 0;
  const renderEntries = $derived.by(() => {
    const current = nativeEntries;
    const keys = new SvelteSet(current.map((entry) => entry.key));
    return [...current, ...retainedEntries.filter((entry) => !keys.has(entry.key))];
  });
  $effect(() => {
    const current = nativeEntries;
    const keys = new SvelteSet(current.map((entry) => entry.key));
    const revision = ++retentionRevision;
    if (retainedEntries.some((entry) => !keys.has(entry.key))) {
      void tick().then(() => {
        if (revision !== retentionRevision) return;
        if (current.length === 0) focusedElement?.blur();
        const item = focusedItem();
        if (item && !keys.has(item.dataset.categoryKey ?? '')) {
          const fallback = [
            ...(root()?.querySelectorAll<HTMLElement>(
              accordion ? '[data-category-key]' : '[role="tab"]',
            ) ?? []),
          ].find((tab) => tab.dataset.categoryKey === nativeKey);
          (accordion
            ? fallback?.querySelector<HTMLElement>('[data-part="item-trigger"]')
            : fallback
          )?.focus();
        }
        retainedEntries = current;
      });
    } else {
      retainedEntries = current;
    }
  });
  $effect(() => {
    const key = nativeKey;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      const container = root();
      if (!categoryFocusWasLost(container, focusedElement)) return;
      if (accordion)
        container
          ?.querySelectorAll<HTMLElement>(
            '[data-scope="accordion"][data-part="item-trigger"]:not([disabled])',
          )
          .item(selection.index)
          ?.focus();
      else container?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  });

  return {
    onfocusin(event: FocusEvent) {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    },
    get nativeEntries() {
      return nativeEntries;
    },
    get nativeKey() {
      return nativeKey;
    },
    set nativeKey(value: string | undefined) {
      nativeKey = value;
    },
    get retainedEntries() {
      return retainedEntries;
    },
    get renderEntries() {
      return renderEntries;
    },
  };
}
