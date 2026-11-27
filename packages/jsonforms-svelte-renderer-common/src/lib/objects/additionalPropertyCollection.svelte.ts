import {
  useJsonForms,
  type useJsonFormsControlWithDetail,
} from '../core/jsonFormsCompositions.svelte';
import { dataPathSegments } from '../core/dataPath';
import { scopeDataSegments } from '../core/schemaScope';
import { collectionErrorPositions } from '../collections/collectionPagination';
import { useCollectionPagination } from '../collections/collectionPagination.svelte';
import { additionalPropertyItem } from './additionalPropertyItem';
import { PropertyIdentityStore } from './propertyIdentity';

export function useAdditionalPropertyCollection(
  getControl: () => ReturnType<typeof useJsonFormsControlWithDetail>['control'],
  disallowedNames: () => readonly string[],
) {
  const control = $derived(getControl());
  const jsonforms = useJsonForms();
  const objectData = $derived(
    control.data !== null && typeof control.data === 'object' && !Array.isArray(control.data)
      ? control.data
      : undefined,
  );
  const names = $derived.by(() => {
    const reserved = [...Object.keys(control.schema.properties ?? {}), ...disallowedNames()];
    return Object.keys(objectData ?? {}).filter((name) => !reserved.includes(name));
  });
  const itemForName = (name: string) =>
    additionalPropertyItem(name, control.schema, control.rootSchema, control.path);
  const items = $derived(names.map(itemForName));
  const identities = new PropertyIdentityStore();
  const keys = $derived(identities.reconcile(names));
  const page = useCollectionPagination({
    get keys() {
      return names;
    },
    get local() {
      return (
        control.uischema.options?.additionalProperties as { pagination?: unknown } | undefined
      )?.pagination;
    },
    get config() {
      return control.config;
    },
    get errors() {
      const path = control.pathSegments
        ? [...control.pathSegments, ...scopeDataSegments(control.uischema.scope)]
        : dataPathSegments(control.path);
      return collectionErrorPositions(jsonforms.core, path, names);
    },
    kind: 'additionalProperties',
  });
  return {
    itemForName,
    identities,
    page,
    get items() {
      return items;
    },
    get keys() {
      return keys;
    },
    get objectData() {
      return objectData;
    },
  };
}
