import { getContext } from 'svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { dataPathSegments } from './dataPath';
import {
  DynamicUiContextSymbol,
  createDynamicUiResolver,
  dynamicBoundValue,
  dynamicCellValue,
  type DynamicUiContext,
} from './dynamicUi';
import { createDynamicTreeResolver, dynamicPresentation, hasDynamicTree } from './dynamicTree';

export function useDynamicTreeResolver() {
  const form = useJsonForms(true);
  const context = getContext<DynamicUiContext | undefined>(DynamicUiContextSymbol);
  let resolvers: WeakMap<UISchemaElement, ReturnType<typeof createDynamicUiResolver>> | undefined;
  let tree: ReturnType<typeof createDynamicTreeResolver> | undefined;
  return (
    element: UISchemaElement,
    path = '',
    segments: readonly string[] = dataPathSegments(path),
    cell = false,
  ): UISchemaElement => {
    // Do not subscribe static schemas to external/data changes or allocate resolution caches.
    if (!hasDynamicTree(element) && !dynamicPresentation(element)) return element;
    if (!context?.value) return element;
    resolvers ??= new WeakMap();
    tree ??= createDynamicTreeResolver();
    return tree(element, (authored) => {
      const presented = dynamicPresentation(authored);
      if (presented) return presented;
      if (!context?.value || !Object.hasOwn(authored, '$dynamic'))
        return { element: authored, failures: [] };
      let resolve = resolvers!.get(authored);
      if (!resolve) {
        resolve = createDynamicUiResolver(context.cache);
        resolvers!.set(authored, resolve);
      }
      return resolve(authored, {
        get data() {
          return form?.core?.data;
        },
        get value() {
          return cell && authored === element
            ? dynamicCellValue(form?.core?.data, segments)
            : dynamicBoundValue(authored, form?.core?.data, segments);
        },
        get item() {
          return segments.length ? context.item : undefined;
        },
        get external() {
          return context.value?.external;
        },
        get config() {
          return form?.config;
        },
        get errors() {
          return form?.core?.errors;
        },
        get locale() {
          return form?.i18n?.locale;
        },
        path,
        trustedFunctions: context.value.trustedFunctions,
      });
    });
  };
}
