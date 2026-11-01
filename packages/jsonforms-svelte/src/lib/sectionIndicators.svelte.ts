import type { UISchemaElement } from '@jsonforms/core';
import { Resolve } from '@jsonforms/core';
import { dataPathSegments } from './dataPath';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { hasGroupValue } from './sectionData';
import { sectionBoundPaths, sectionErrors, sectionValidation } from './sectionValidation';
import { useRendererMessages } from './rendererMessages.svelte';
import { resolveSectionBoolean } from './sectionOptions';
import { useLegacySectionOptionDiagnostic } from './sectionOptions.svelte';

/** Shared traversal for Group and Category data/validation indicators. */
export function useSectionIndicators(
  layout: () => { uischema: UISchemaElement; path: string },
  diagnoseLegacy = false,
) {
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
  const errors = $derived(sectionErrors(form.core, dataPathSegments(layout().path), paths));
  const dataIndicatorOption = $derived(
    resolveSectionBoolean(layout().uischema.options, form.config, 'showDataIndicator'),
  );
  if (diagnoseLegacy)
    useLegacySectionOptionDiagnostic(
      'showDataIndicator',
      () => dataIndicatorOption.legacyFlatDefault,
    );
  const hasData = $derived.by(() => {
    if (!dataIndicatorOption.value) return false;
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
    get errors() {
      return errors;
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
