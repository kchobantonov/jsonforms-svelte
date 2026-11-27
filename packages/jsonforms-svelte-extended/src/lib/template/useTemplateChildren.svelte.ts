import type { UISchemaElement } from '@jsonforms/core';
import type {
  UIDiagnosticReporter,
  useDynamicTreeResolver,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { templateChildren } from './templateChildren';

export function useTemplateChildren(
  getElements: () => UISchemaElement[],
  getPath: () => string,
  getResolver: () => ReturnType<typeof useDynamicTreeResolver> | undefined,
  report: UIDiagnosticReporter,
) {
  const children = $derived(templateChildren(getElements()));
  const elements = $derived.by(() => {
    const resolve = getResolver();
    return resolve
      ? children.elements.map((element) => ({ ...resolve(element, getPath()), name: element.name }))
      : children.elements;
  });
  const byName = $derived(Object.fromEntries(elements.map((element) => [element.name, element])));
  let previous: string[] = [];
  let previousPath: string | undefined;
  $effect(() => {
    const path = getPath();
    const names = children.duplicateNames;
    for (const name of names) {
      if (path !== previousPath || !previous.includes(name))
        report('template.duplicateChild', {
          severity: 'warning',
          message: 'Several template children have the same name; the last is used.',
          path,
          details: { name },
        });
    }
    previous = names;
    previousPath = path;
  });
  return {
    get elements() {
      return elements;
    },
    get byName() {
      return byName;
    },
  };
}
