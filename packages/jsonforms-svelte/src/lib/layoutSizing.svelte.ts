import { ruleValidationAjv, ruleValidationElement } from './ruleValidation';
import { getAjv, getConfig, isVisible, type Layout } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { horizontalLayoutWidths } from './horizontalLayout';
import {
  containerStyle,
  containerOptionDiagnostics,
  itemSizing,
  legacySizingDiagnosticEntries,
  resolveGap,
  resolveGridColumns,
  resolveMinItemWidth,
  resolveSpacerSize,
  toCss,
  type LayoutContainerOptions,
  type LayoutStyle,
} from './layoutSizing';

/** Shared sizing and effective visibility for structural layout adapters. */
export function useLayoutSizing(
  layout: () => { uischema: Layout; path: string; direction?: string },
  legacyColumns: () => boolean = () => false,
) {
  const form = useJsonForms();
  const state = $derived.by(() => {
    const current = layout();
    const direction = current.direction === 'row' ? 'row' : 'column';
    const all = current.uischema.elements ?? [];
    const options = current.uischema.options as LayoutContainerOptions | undefined;
    const defaults = (
      form.config as { jsonformsExtended?: { layoutDefaults?: unknown } } | undefined
    )?.jsonformsExtended?.layoutDefaults;
    const portable =
      defaults !== undefined ||
      ['gap', 'wrap', 'align', 'justify', 'gridColumns', 'minItemWidth'].some(
        (key) => current.uischema.options?.[key] !== undefined,
      ) ||
      all.some((element) => element.options?.layout !== undefined || element.type === 'Spacer');
    // Legacy columns require an explicitly selected adapter; the default is portable.
    const legacy =
      legacyColumns() &&
      direction === 'row' &&
      !portable &&
      all.some((element) => element.options && Object.hasOwn(element.options, 'columns'));
    const coreState = { jsonforms: form };
    const visible = all
      .map((element, index) => ({ element, index }))
      .filter(({ element }) =>
        isVisible(
          ruleValidationElement(element, getAjv(coreState)),
          form.core?.data,
          current.path,
          ruleValidationAjv(getAjv(coreState)),
          getConfig(coreState),
        ),
      );
    const gap = resolveGap(options, form.config, direction);
    const grid = resolveGridColumns(options, form.config);
    const container = containerStyle(options, form.config, direction);
    if (legacy) container.flexWrap = 'wrap';
    const legacyItems = legacy
      ? horizontalLayoutWidths(
          visible.map(({ element }) => element.options?.columns),
          toCss(gap),
        )
      : [];
    const items = visible.map(({ element, index }, visibleIndex) => {
      const old = legacyItems[visibleIndex];
      if (old)
        return {
          element,
          index,
          columns: old.columns,
          style: {
            flex: old.style.split(';')[0].slice('flex: '.length),
            minWidth: 0,
          } as LayoutStyle,
          diagnostics: old.diagnostic ? [old.diagnostic] : [],
          diagnosticEntries: old.diagnostic
            ? [{ code: 'layout.invalidOption' as const, message: old.diagnostic }]
            : [],
        };
      const sizedElement =
        element.type === 'Spacer'
          ? { ...element, size: resolveSpacerSize(element, form.config) }
          : element;
      const sized = itemSizing(
        sizedElement,
        direction,
        grid,
        gap,
        resolveMinItemWidth(options, form.config),
      );
      const legacyDiagnosticEntries = legacySizingDiagnosticEntries(element);
      return {
        element,
        index,
        columns: undefined,
        style: sized.style,
        diagnostics: [
          ...sized.diagnostics,
          ...legacyDiagnosticEntries.map(({ message }) => message),
        ],
        diagnosticEntries: [...sized.diagnosticEntries, ...legacyDiagnosticEntries],
      };
    });
    return {
      direction,
      legacy,
      container,
      items,
      containerDiagnostics: containerOptionDiagnostics(options, form.config, direction),
    };
  });
  const reported = new Set<string>();
  $effect(() => {
    const path = layout().path;
    for (const diagnostic of state.containerDiagnostics) {
      const key = `${path}:-1:${diagnostic.message}`;
      if (reported.has(key)) continue;
      reported.add(key);
      console.warn(diagnostic.code, { message: diagnostic.message, path, index: -1 });
    }
    for (const item of state.items) {
      for (const diagnostic of item.diagnosticEntries) {
        const key = `${path}:${item.index}:${diagnostic.code}:${diagnostic.message}`;
        if (reported.has(key)) continue;
        reported.add(key);
        console.warn(diagnostic.code, { message: diagnostic.message, path, index: item.index });
      }
    }
  });
  return {
    get direction() {
      return state.direction;
    },
    get legacy() {
      return state.legacy;
    },
    get container() {
      return state.container;
    },
    get containerDiagnostics() {
      return state.containerDiagnostics;
    },
    get items() {
      return state.items;
    },
  };
}
