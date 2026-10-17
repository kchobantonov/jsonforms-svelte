import { scopeDataSegments } from './schemaScope';
import { useRendererMessages } from './rendererMessages.svelte';
import { Resolve, type UISchemaElement } from '@jsonforms/core';
import { untrack } from 'svelte';
import { useJsonForms } from './jsonFormsCompositions.svelte.js';

import { hasGroupValue } from './sectionData';
export { hasGroupValue } from './sectionData';
import { useSectionIndicators } from './sectionIndicators.svelte';

export function groupHasData(element: UISchemaElement, data: unknown, path = ''): boolean {
  const node = element as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
  if (
    (node.type === 'Control' || node.type === 'ListWithDetail') &&
    typeof node.scope === 'string'
  ) {
    const context = path ? Resolve.data(data, path) : data;
    const segments = scopeDataSegments(node.scope);
    const value = segments.reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, key)
          ? (value as Record<string, unknown>)[key]
          : undefined,
      context,
    );
    if (hasGroupValue(value)) return true;
  }
  return node.elements?.some((child) => groupHasData(child, data, path)) ?? false;
}

type Options = Record<string, unknown>;
const record = (value: unknown): Options | undefined =>
  value !== null && typeof value === 'object' ? (value as Options) : undefined;

export type CollapseComponent = 'group' | 'mixed' | 'accordion' | 'array';

/** Flat collapsed configuration belongs to legacy renderers, not portable frames. */
export function resolveCollapsed(
  options: Options | undefined,
  config: unknown,
  component: CollapseComponent,
): boolean {
  const extended = record(record(config)?.jsonformsExtended);
  return (
    [options?.collapsed, record(extended?.[component])?.collapsed, extended?.collapsed].find(
      (value) => typeof value === 'boolean',
    ) === true
  );
}

export function useGroupState(layout: () => { uischema: UISchemaElement; path: string }) {
  const jsonforms = useJsonForms();
  const translate = useRendererMessages();
  const indicators = useSectionIndicators(layout);
  function option(name: string) {
    const config = record(jsonforms.config);
    return (
      layout().uischema.options?.[name] ??
      record(config?.jsonformsExtended)?.[name] ??
      config?.[name]
    );
  }
  const initiallyCollapsed = $derived(
    resolveCollapsed(layout().uischema.options, jsonforms.config, 'group'),
  );
  // Writable derived state requires Svelte 5.25; the declared peer range still starts at 5.0.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let collapsed = $state(untrack(() => initiallyCollapsed));
  $effect(() => {
    collapsed = initiallyCollapsed;
  });
  return {
    get collapsible() {
      return option('collapsible') === true;
    },
    get collapsed() {
      return option('collapsible') === true && collapsed;
    },
    get hasData() {
      return indicators.hasData;
    },
    get hasValidationErrors() {
      return indicators.validation.show;
    },
    get dataIndicatorLabel() {
      return translate('group.dataIndicator');
    },
    get label() {
      return translate('group.label');
    },
    setExpanded(expanded: boolean) {
      collapsed = !expanded;
    },
    toggle() {
      collapsed = !collapsed;
    },
  };
}

/** Mixed containers are expanded and collapsible unless the host opts out. */
export function useMixedFrameState(element: () => UISchemaElement) {
  const jsonforms = useJsonForms();
  const initiallyCollapsed = $derived(
    resolveCollapsed(element().options, jsonforms.config, 'mixed'),
  );
  const collapsible = $derived.by(() => {
    const config = record(jsonforms.config);
    return (
      ([
        element().options?.collapsible,
        record(config?.jsonformsExtended)?.collapsible,
        config?.collapsible,
      ].find((value) => typeof value === 'boolean') ?? true) === true
    );
  });
  // eslint-disable-next-line svelte/prefer-writable-derived
  let collapsed = $state(untrack(() => initiallyCollapsed));
  $effect(() => {
    collapsed = initiallyCollapsed;
  });
  return {
    get collapsible() {
      return collapsible;
    },
    get expanded() {
      return !collapsible || !collapsed;
    },
    set expanded(value: boolean) {
      collapsed = !value;
    },
  };
}
