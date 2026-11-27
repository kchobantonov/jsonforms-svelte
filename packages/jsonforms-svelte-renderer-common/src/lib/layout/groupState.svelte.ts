import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte';
import { scopeDataSegments } from '../core/schemaScope.js';
import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
import { dataPathSegments } from '../core/dataPath.js';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { useUIDiagnosticReporter } from '../validation/authorDiagnostic.svelte.js';
import { type Layout, type UISchemaElement } from '@jsonforms/core';
import { untrack } from 'svelte';

import { useObjectErrors } from '../validation/objectErrors.svelte';
import { hasGroupValue } from './sectionData';
export { hasGroupValue } from './sectionData';
import { useSectionIndicators } from './sectionIndicators.svelte';
import { resolveSectionBoolean } from './sectionOptions';

export function groupHasData(
  element: UISchemaElement,
  data: unknown,
  path: string | readonly string[] = '',
): boolean {
  const node = element as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
  if (
    (node.type === 'Control' || node.type === 'ListWithDetail') &&
    typeof node.scope === 'string'
  ) {
    const context = (typeof path === 'string' ? dataPathSegments(path) : path).reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, key)
          ? (value as Record<string, unknown>)[key]
          : undefined,
      data,
    );
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
  const reportDiagnostic = useUIDiagnosticReporter();
  let reportedCondition: string | undefined;
  $effect(() => {
    const extended = record(record(config())?.jsonformsExtended);
    const candidates = [
      [`options.collapsed`, options()?.collapsed],
      [`config.jsonformsExtended.${component}.collapsed`, record(extended?.[component])?.collapsed],
      ['config.jsonformsExtended.collapsed', extended?.collapsed],
    ] as const;
    const supplied = candidates.find(([, value]) => value !== undefined);
    if (!supplied || typeof supplied[1] === 'boolean') {
      reportedCondition = undefined;
      return;
    }
    const type = supplied[1] === null ? 'null' : typeof supplied[1];
    const condition = JSON.stringify([supplied[0], type]);
    if (reportedCondition === condition) return;
    reportedCondition = condition;
    reportDiagnostic('section.invalidCollapsed', {
      severity: 'warning',
      message: 'The collapsed option must be a boolean; the invalid value is ignored.',
      details: {
        component,
        source: supplied[0],
        type,
      },
    });
  });
}

/** Resolve collapsed from the local option and namespaced defaults. */
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

/** Array items use the same portable collapse setting as their parent. */
export function resolveArrayItemCollapsed(options: Options | undefined, config: unknown): boolean {
  return resolveCollapsed(options, config, 'array');
}

/** The outer array panel is independent of individual item expansion. */
export function useArrayPanelState(options: () => Options | undefined, config: () => unknown) {
  useCollapsedOptionDiagnostic(options, config, 'array');
  const initial = $derived(resolveCollapsed(options(), config(), 'array'));
  const collapsibleOption = $derived(
    resolveSectionBoolean(options(), config(), 'collapsible', false, 'boolean'),
  );
  const collapsible = $derived(collapsibleOption);
  // eslint-disable-next-line svelte/prefer-writable-derived
  let collapsed = $state(untrack(() => initial));
  $effect(() => {
    collapsed = initial;
  });
  const message = useRendererMessages();
  function toggle() {
    collapsed = !collapsed;
  }
  return {
    toggleAttributes(id: string, label: string) {
      return {
        'data-array-panel-toggle': '',
        'aria-label': message(collapsible && collapsed ? 'tree.expand' : 'tree.collapse', {
          label,
        }),
        'aria-expanded': !(collapsible && collapsed),
        'aria-controls': id,
        onclick: toggle,
      };
    },
    get collapsible() {
      return collapsible;
    },
    get collapsed() {
      return collapsible && collapsed;
    },
    toggle,
  };
}

export function useGroupState(
  layout: () => {
    uischema: UISchemaElement;
    path: string;
    pathSegments?: readonly string[];
    label?: string;
  },
) {
  const jsonforms = useJsonForms();
  useCollapsedOptionDiagnostic(
    () => layout().uischema.options,
    () => jsonforms.config,
    'group',
  );
  const showBorder = $derived(layout().uischema.options?.showBorder !== false);
  const regions = $derived(
    layout().uischema as Layout & {
      cover?: UISchemaElement;
      header?: UISchemaElement[];
      i18n?: string;
      footer?: UISchemaElement[];
    },
  );
  const footer = $derived(regions.footer);
  const resolveHeader = useDynamicTreeResolver();
  const headerLabel = $derived(
    regions.header
      ?.map((element) => resolveHeader(element, layout().path, layout().pathSegments))
      .find((element) => element.type === 'Label') as { text?: string; i18n?: string } | undefined,
  );
  const headerTitle = $derived(
    headerLabel?.i18n
      ? (jsonforms.i18n?.translate?.(`${headerLabel.i18n}.text`, headerLabel.text) ??
          headerLabel.text)
      : headerLabel?.text,
  );
  const translate = useRendererMessages();
  const indicators = useSectionIndicators(layout);
  const errors = useObjectErrors(layout);
  const collapsibleOption = $derived(
    resolveSectionBoolean(layout().uischema.options, jsonforms.config, 'collapsible'),
  );
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
    get indicatorProps() {
      const { uischema, path, pathSegments } = layout();
      return {
        uischema,
        path,
        pathSegments,
        errorMessage: errors.message,
        errorErrors: errors.errors,
      };
    },
    get showHeading() {
      return Boolean(
        layout().label ||
        collapsibleOption ||
        indicators.hasData ||
        regions.header?.length ||
        (errors.message === undefined ? indicators.validation.show : errors.message),
      );
    },
    get frameLabel() {
      return headerTitle || layout().label || undefined;
    },
    get triggerLabel() {
      return headerTitle || layout().label || translate('group.label');
    },
    get showBorder() {
      return showBorder;
    },
    get regions() {
      return regions;
    },
    get footer() {
      return footer;
    },
    get headerTitle() {
      return headerTitle;
    },
    get collapsible() {
      return collapsibleOption;
    },
    get collapsed() {
      return collapsibleOption && collapsed;
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
  const collapsible = $derived(collapsibleOption);
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
