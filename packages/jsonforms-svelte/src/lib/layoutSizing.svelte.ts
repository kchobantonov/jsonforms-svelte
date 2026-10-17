import { ruleValidationAjv, ruleValidationElement } from './ruleValidation';
import { useRendererMessages } from './rendererMessages.svelte';
import { getAjv, getConfig, isVisible, type Layout } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { horizontalLayoutWidths } from './horizontalLayout';
import {
  containerStyle,
  itemSizing,
  legacySizingDiagnostics,
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
  const translate = useRendererMessages();
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
          ruleValidationElement(element),
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
      return {
        element,
        index,
        columns: undefined,
        style: sized.style,
        diagnostics: [...sized.diagnostics, ...legacySizingDiagnostics(element)],
      };
    });
    return { direction, legacy, container, items };
  });
  function message(diagnostic: string): string {
    let key = 'invalidOption';
    if (diagnostic.includes('`span` must')) key = 'invalidSpan';
    if (diagnostic.includes('vertical layout')) key = 'verticalSpan';
    if (diagnostic.includes('exceeds gridColumns')) key = 'spanClamped';
    if (diagnostic.includes('`weight`')) key = 'invalidWeight';
    if (diagnostic.includes('non-negative dimension')) key = 'invalidDimension';
    if (diagnostic.includes('`columns`')) key = 'legacyColumns';
    if (diagnostic.includes('`trim`')) key = 'legacyTrim';
    return translate(`layout.${key}`, { diagnostic, dimension: diagnostic.split('`')[1] });
  }
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
    get items() {
      return state.items;
    },
    get diagnostics() {
      return state.items.flatMap((item) => item.diagnostics.map(message));
    },
  };
}
