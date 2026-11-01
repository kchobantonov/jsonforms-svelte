import { scopeDataSegments } from './schemaScope';
import { useRendererMessages } from './rendererMessages.svelte';
import { Resolve, type UISchemaElement } from '@jsonforms/core';
import { untrack } from 'svelte';
import { useJsonForms } from './jsonFormsCompositions.svelte.js';

import { hasGroupValue } from './sectionData';
export { hasGroupValue } from './sectionData';
import { useSectionIndicators } from './sectionIndicators.svelte';
import { resolveSectionBoolean } from './sectionOptions';
import { useLegacySectionOptionDiagnostic } from './sectionOptions.svelte';

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

/** Report an invalid effective collapse option without treating it as truthy. */
export function useCollapsedOptionDiagnostic(
  options: () => Options | undefined,
  config: () => unknown,
  component: CollapseComponent,
) {
  const reported = new Set<string>();
  $effect(() => {
    const extended = record(record(config())?.jsonformsExtended);
    const candidates = [
      [`options.collapsed`, options()?.collapsed],
      [`config.jsonformsExtended.${component}.collapsed`, record(extended?.[component])?.collapsed],
      ['config.jsonformsExtended.collapsed', extended?.collapsed],
    ] as const;
    const supplied = candidates.find(([, value]) => value !== undefined);
    if (!supplied || typeof supplied[1] === 'boolean' || reported.has(supplied[0])) return;
    reported.add(supplied[0]);
    console.warn('section.invalidCollapsed', {
      component,
      source: supplied[0],
      type: supplied[1] === null ? 'null' : typeof supplied[1],
    });
  });
}

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

/** Keep the former local array option only when no portable collapse default was supplied. */
export function resolveArrayItemCollapsed(options: Options | undefined, config: unknown): boolean {
  const extended = record(record(config)?.jsonformsExtended);
  if (
    [options?.collapsed, record(extended?.array)?.collapsed, extended?.collapsed].some(
      (value) => typeof value === 'boolean',
    )
  ) {
    return resolveCollapsed(options, config, 'array');
  }
  return options?.initCollapsed === true;
}

/** The outer array panel is independent of individual item expansion. */
export function useArrayPanelState(options: () => Options | undefined, config: () => unknown) {
  useCollapsedOptionDiagnostic(options, config, 'array');
  const initial = $derived(resolveCollapsed(options(), config(), 'array'));
  const collapsibleOption = $derived(
    resolveSectionBoolean(options(), config(), 'collapsible', false, 'boolean'),
  );
  useLegacySectionOptionDiagnostic('collapsible', () => collapsibleOption.legacyFlatDefault);
  const collapsible = $derived(collapsibleOption.value);
  // eslint-disable-next-line svelte/prefer-writable-derived
  let collapsed = $state(untrack(() => initial));
  $effect(() => {
    collapsed = initial;
  });
  return {
    get collapsible() {
      return collapsible;
    },
    get collapsed() {
      return collapsible && collapsed;
    },
    toggle() {
      collapsed = !collapsed;
    },
  };
}

export function useGroupState(layout: () => { uischema: UISchemaElement; path: string }) {
  const jsonforms = useJsonForms();
  useCollapsedOptionDiagnostic(
    () => layout().uischema.options,
    () => jsonforms.config,
    'group',
  );
  const translate = useRendererMessages();
  const indicators = useSectionIndicators(layout);
  const collapsibleOption = $derived(
    resolveSectionBoolean(layout().uischema.options, jsonforms.config, 'collapsible'),
  );
  useLegacySectionOptionDiagnostic('collapsible', () => collapsibleOption.legacyFlatDefault);
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
      return collapsibleOption.value;
    },
    get collapsed() {
      return collapsibleOption.value && collapsed;
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
  useCollapsedOptionDiagnostic(
    () => element().options,
    () => jsonforms.config,
    'mixed',
  );
  const initiallyCollapsed = $derived(
    resolveCollapsed(element().options, jsonforms.config, 'mixed'),
  );
  const collapsibleOption = $derived(
    resolveSectionBoolean(element().options, jsonforms.config, 'collapsible', true, 'boolean'),
  );
  useLegacySectionOptionDiagnostic('collapsible', () => collapsibleOption.legacyFlatDefault);
  const collapsible = $derived(collapsibleOption.value);
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
