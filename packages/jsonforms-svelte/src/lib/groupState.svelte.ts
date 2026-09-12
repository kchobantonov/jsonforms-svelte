import { toDataPathSegments, Resolve, type UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte.js';

/** False and zero are data; empty containers and blank strings are not. */
export function hasGroupValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasGroupValue);
  if (typeof value === 'object') return Object.values(value).some(hasGroupValue);
  return true;
}

export function groupHasData(element: UISchemaElement, data: unknown, path = ''): boolean {
  const node = element as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
  if (node.type === 'Control' && typeof node.scope === 'string') {
    const context = path ? Resolve.data(data, path) : data;
    const segments = toDataPathSegments(node.scope);
    const value = segments.reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object'
          ? (value as Record<string, unknown>)[key]
          : undefined,
      context,
    );
    if (hasGroupValue(value)) return true;
  }
  return node.elements?.some((child) => groupHasData(child, data, path)) ?? false;
}

export function useGroupState(
  layout: () => { uischema: UISchemaElement; path: string },
  options: () => Record<string, unknown>,
) {
  const jsonforms = useJsonForms();
  let collapsed = $state(false);
  const initiallyCollapsed = $derived(options().collapsed === true);
  $effect(() => {
    collapsed = initiallyCollapsed;
  });
  return {
    get collapsible() {
      return options().collapsible === true;
    },
    get collapsed() {
      return options().collapsible === true && collapsed;
    },
    get hasData() {
      return (
        options().showDataIndicator === true &&
        groupHasData(layout().uischema, jsonforms.core?.data, layout().path)
      );
    },
    toggle() {
      collapsed = !collapsed;
    },
  };
}
