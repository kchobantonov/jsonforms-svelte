import {
  createRuleReferenceReporter,
  ruleValidationAjv,
  ruleValidationElement,
} from './ruleValidation';
import { dataPathSegments } from './dataPath';
import { getAjv, getConfig, isVisible, type Layout } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';
import {
  containerStyle,
  containerOptionDiagnostics,
  itemSizing,
  resolveGap,
  resolveGridColumns,
  resolveMinItemWidth,
  resolveSpacerSize,
  type LayoutContainerOptions,
} from './layoutSizing';

/** Shared sizing and effective visibility for structural layout adapters. */
export function useLayoutSizing(
  layout: () => {
    uischema: Layout;
    path: string;
    pathSegments?: readonly string[];
    direction?: string;
  },
) {
  const form = useJsonForms();
  const reportDiagnostic = useUIDiagnosticReporter();
  const reportRuleReference = createRuleReferenceReporter(
    reportDiagnostic,
    () => layout().path,
    () => layout().uischema,
  );
  const state = $derived.by(() => {
    const current = layout();
    const direction = current.direction === 'row' ? 'row' : 'column';
    const all = current.uischema.elements ?? [];
    const options = current.uischema.options as LayoutContainerOptions | undefined;
    const coreState = { jsonforms: form };
    const visible = all
      .map((element, index) => ({ element, index }))
      .filter(({ element }) =>
        isVisible(
          ruleValidationElement(
            element,
            getAjv(coreState),
            current.pathSegments ?? dataPathSegments(current.path),
            reportRuleReference,
          ),
          form.core?.data,
          current.path,
          ruleValidationAjv(getAjv(coreState)),
          getConfig(coreState),
        ),
      );
    const gap = resolveGap(options, form.config, direction);
    const grid = resolveGridColumns(options, form.config);
    const container = containerStyle(options, form.config, direction);
    const items = visible.map(({ element, index }) => {
      const sizedElement =
        element.type === 'Spacer' ? { ...element, size: resolveSpacerSize(element) } : element;
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
        style: sized.style,
        diagnostics: sized.diagnostics,
        diagnosticEntries: sized.diagnosticEntries,
      };
    });
    return {
      direction,
      container,
      items,
      containerDiagnostics: containerOptionDiagnostics(
        options,
        form.config,
        direction,
        (current.uischema.type === 'HorizontalLayout' ||
          current.uischema.type === 'VerticalLayout') &&
          current.uischema.options?.variant === 'splitter',
      ),
    };
  });
  let reported = new Set<string>();
  $effect(() => {
    const path = layout().path;
    const active = new Set<string>();
    for (const diagnostic of state.containerDiagnostics) {
      const key = JSON.stringify([path, -1, diagnostic.code, diagnostic.message]);
      active.add(key);
      if (reported.has(key)) continue;
      reported.add(key);
      reportDiagnostic(diagnostic.code, {
        severity: 'warning',
        message: diagnostic.message,
        path,
        index: -1,
      });
    }
    for (const item of state.items) {
      for (const diagnostic of item.diagnosticEntries) {
        const key = JSON.stringify([path, item.index, diagnostic.code, diagnostic.message]);
        active.add(key);
        if (reported.has(key)) continue;
        reported.add(key);
        reportDiagnostic(diagnostic.code, {
          severity: 'warning',
          message: diagnostic.message,
          path,
          index: item.index,
        });
      }
    }
    reported = active;
  });
  return {
    get direction() {
      return state.direction;
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
