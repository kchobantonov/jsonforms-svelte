import type { UISchemaElement } from '@jsonforms/core';
import { Resolve } from '@jsonforms/core';
import { dataPathSegments } from './dataPath';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { hasGroupValue } from './sectionData';
import { sectionBoundPaths, sectionValidation } from './sectionValidation';
import { useRendererMessages } from './rendererMessages.svelte';

/** Shared traversal for Group and Category data/validation indicators. */
export function useSectionIndicators(layout: () => { uischema: UISchemaElement; path: string }) {
  const form = useJsonForms();
  const message = useRendererMessages();
  const paths = $derived(sectionBoundPaths(layout().uischema));
  const validation = $derived(
    sectionValidation(
      form.core,
      dataPathSegments(layout().path),
      layout().uischema,
      form.config,
      paths,
    ),
  );
  const hasData = $derived.by(() => {
    const config = form.config as Record<string, unknown> | undefined;
    const extended = config?.jsonformsExtended as Record<string, unknown> | undefined;
    if (
      (layout().uischema.options?.showDataIndicator ??
        extended?.showDataIndicator ??
        config?.showDataIndicator) !== true
    )
      return false;
    const context = layout().path ? Resolve.data(form.core?.data, layout().path) : form.core?.data;
    return paths.some((path) =>
      hasGroupValue(
        path.reduce<unknown>(
          (value, segment) =>
            value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
              ? (value as Record<string, unknown>)[segment]
              : undefined,
          context,
        ),
      ),
    );
  });
  return {
    get hasData() {
      return hasData;
    },
    get dataLabel() {
      return message('group.dataIndicator');
    },
    get validation() {
      return validation;
    },
    get validationLabel() {
      return message(
        validation.count === undefined
          ? 'validation.containerHasErrors'
          : validation.count === 1
            ? 'validation.containerError'
            : 'validation.containerErrors',
        { count: validation.count },
      );
    },
  };
}
