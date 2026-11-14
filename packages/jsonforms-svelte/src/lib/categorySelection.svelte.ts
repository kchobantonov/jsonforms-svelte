import { dynamicTreeAuthor } from './dynamicTree';
import { untrack } from 'svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';

interface CategoryState {
  readonly visible: boolean;
  readonly uischema: UISchemaElement;
}

/** A disappearing category header may leave focus on the page or its custom-element host. */
export function categoryFocusWasLost(
  root: HTMLElement | undefined,
  focusedElement: HTMLElement | undefined,
): boolean {
  if (!root || !focusedElement) return false;
  const wasInsideRoot = !focusedElement.isConnected || root.contains(focusedElement);
  if (!wasInsideRoot) return false;
  const tree = root.getRootNode();
  if (tree instanceof ShadowRoot)
    return (
      tree.activeElement === null &&
      (document.activeElement === tree.host || document.activeElement === document.body)
    );
  return document.activeElement === document.body;
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
  const reportDiagnostic = useUIDiagnosticReporter();
  const unnamedIdentity = new WeakMap<UISchemaElement, number>();
  let nextUnnamedIdentity = 0;
  let previousUnnamed: { key: string; signature: string }[] = [];
  const signature = (schema: UISchemaElement): string => {
    const category = dynamicTreeAuthor(schema) as UISchemaElement & {
      label?: string;
      i18n?: string;
      elements?: UISchemaElement[];
    };
    return JSON.stringify([
      category.type,
      category.i18n ?? category.label,
      category.elements?.map((child) => [
        child.type,
        (child as { scope?: string }).scope,
        (child as { i18n?: string }).i18n ?? (child as { label?: string }).label,
      ]),
    ]);
  };
  const objectKey = (schema: UISchemaElement, signature: string, used: Set<string>) => {
    schema = dynamicTreeAuthor(schema);
    let identity = unnamedIdentity.get(schema);
    if (identity === undefined) {
      const retained = previousUnnamed.find(
        (entry) => entry.signature === signature && !used.has(entry.key),
      );
      identity = retained ? Number(retained.key.slice('object:'.length)) : ++nextUnnamedIdentity;
      unnamedIdentity.set(schema, identity);
    }
    return `object:${identity}`;
  };
  const allEntries = $derived.by(() => {
    const categories = source.categories;
    const names = categories.map((category) => {
      const name = (dynamicTreeAuthor(category.uischema) as UISchemaElement & { name?: unknown })
        .name;
      return typeof name === 'string' && name.length ? name : undefined;
    });
    const counts = new Map<string, number>();
    for (const name of names) if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    const used = new Set<string>();
    const nextUnnamed: { key: string; signature: string }[] = [];
    const result = categories.map((category, index) => {
      const key =
        names[index] && counts.get(names[index]) === 1
          ? `name:${names[index]}`
          : objectKey(category.uischema, signature(category.uischema), used);
      used.add(key);
      if (key.startsWith('object:'))
        nextUnnamed.push({ key, signature: signature(category.uischema) });
      return { category, key };
    });
    previousUnnamed = nextUnnamed;
    return result;
  });
  const entries = $derived(allEntries.filter(({ category }) => category.visible));
  const initialKey = () => {
    const initial = source.initial;
    const match =
      typeof initial === 'string' && initial.length
        ? entries.find(
            (entry) =>
              (dynamicTreeAuthor(entry.category.uischema) as { name?: unknown }).name === initial,
          )
        : undefined;
    return match?.key ?? entries[0]?.key;
  };
  // Selection must remember visibility fallback, not recompute from the initial option.
  let selected = $state<string | null | undefined>(
    untrack(() => (closable && source.collapsed && !source.initial ? null : initialKey())),
  );
  let reportedMissingInitial: string | undefined;
  $effect(() => {
    const initial = source.initial;
    const missing =
      typeof initial === 'string' &&
      initial.length > 0 &&
      !entries.some(
        (entry) =>
          (dynamicTreeAuthor(entry.category.uischema) as { name?: unknown }).name === initial,
      );
    if (!missing) {
      reportedMissingInitial = undefined;
      return;
    }
    if (reportedMissingInitial === initial) return;
    reportedMissingInitial = initial;
    reportDiagnostic('categorization.initialNotFound', {
      severity: 'warning',
      message: 'The initial category does not match a visible category; opening the first one.',
      details: { initial },
    });
  });
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
    get allEntries() {
      return allEntries;
    },
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
