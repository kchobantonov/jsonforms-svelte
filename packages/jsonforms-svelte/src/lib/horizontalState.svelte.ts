import { getAjv, getConfig, isVisible, type Layout } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte.js';
import { horizontalLayoutWidths } from './horizontalLayout.js';

export function useHorizontalLayout(layout: () => { uischema: Layout; path: string }) {
  const jsonforms = useJsonForms();
  return {
    get items() {
      const state = { jsonforms };
      const elements = layout()
        .uischema.elements.map((element, index) => ({ element, index }))
        .filter(({ element }) =>
          isVisible(element, jsonforms.core?.data, layout().path, getAjv(state), getConfig(state)),
        );
      const widths = horizontalLayoutWidths(
        elements.map(({ element }) => element.options?.columns),
      );
      return elements.map((item, index) => ({ ...item, ...widths[index] }));
    },
  };
}
