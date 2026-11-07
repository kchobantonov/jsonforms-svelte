import { onDestroy } from 'svelte';
import type { LabelElement } from '@jsonforms/core';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { useFormContext } from '../jsonFormsCompositions.svelte';
import { loadInterpolation } from './loaders';
import { resolveMarkup } from './markup';
import { labelSummaryText } from './labelSummaryText';

/** Optional evaluation stays lazy; a grid refreshes its view when this state changes. */
export function useLabelSummaryText(labels: () => readonly LabelElement[]) {
  const form = useJsonForms();
  const context = useFormContext(true);
  let evaluator = $state.raw<Awaited<ReturnType<typeof loadInterpolation>>>();
  let markdown = $state.raw<typeof import('./markdown')>();
  let requestedMarkdown = false;
  let requested = false;
  let active = true;
  onDestroy(() => {
    active = false;
  });
  $effect(() => {
    if (
      requested ||
      !labels().some((label) => resolveMarkup(label.options, form.config).interpolate)
    )
      return;
    requested = true;
    void loadInterpolation()
      .then((module) => {
        if (active) evaluator = module;
      })
      .catch(() => {
        // The dispatched Label reports loader failures; search stays empty.
      });
  });
  $effect(() => {
    if (
      requestedMarkdown ||
      !labels().some((label) => resolveMarkup(label.options, form.config).markdown)
    )
      return;
    requestedMarkdown = true;
    void import('./markdown')
      .then((module) => {
        if (active) markdown = module;
      })
      .catch(() => {
        // The visible Label reports parser failures; search stays empty.
      });
  });
  return {
    get revision() {
      if (!labels().length) return undefined;
      return [evaluator, markdown, form.config, form.i18n?.locale, form.i18n?.translate];
    },
    text(label: LabelElement, path: string, item: unknown) {
      return labelSummaryText({ jsonforms: form }, label, path, item, context, evaluator, markdown);
    },
  };
}
