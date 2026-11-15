import { useDynamicTreeResolver } from './dynamicTree.svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { dataPathSegments } from './dataPath';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { hasGroupValue } from './sectionData';
import { sectionBoundPaths, sectionErrors, sectionValidation } from './sectionValidation';
import { useRendererMessages } from './rendererMessages.svelte';
import { resolveSectionBoolean } from './sectionOptions';

/** Shared traversal for Group and Category data/validation indicators. */
export function useSectionIndicators(
  layout: () => {
    uischema: UISchemaElement;
    path: string;
    pathSegments?: readonly string[];
  },
) {
  const form = useJsonForms();
  const resolveTree = useDynamicTreeResolver();
  const effective = $derived(resolveTree(layout().uischema, layout().path, layout().pathSegments));
  const message = useRendererMessages();
  const paths = $derived(sectionBoundPaths(effective));
  const contextSegments = $derived(layout().pathSegments ?? dataPathSegments(layout().path));
  const validation = $derived(
    sectionValidation(form.core, contextSegments, effective, form.config, paths),
  );
  const errors = $derived(sectionErrors(form.core, contextSegments, paths));
  const dataIndicatorOption = $derived(
    resolveSectionBoolean(layout().uischema.options, form.config, 'showDataIndicator'),
  );
  const hasData = $derived.by(() => {
    if (!dataIndicatorOption) return false;
    const context = contextSegments.reduce<unknown>(
      (value, segment) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      form.core?.data,
    );
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
