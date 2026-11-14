<script lang="ts">
  import { getContext, setContext, type Snippet } from 'svelte';
  import {
    CollectionItemContextSymbol,
    type CollectionItemIdentity,
  } from '../collectionItem.svelte';
  import { DynamicUiContextSymbol, type DynamicUiContext } from '../dynamicUi';
  import { dataPathSegments } from '../dataPath';
  import { useJsonForms } from '../jsonFormsCompositions.svelte';
  // eslint-disable-next-line svelte/no-unused-props -- Context getters read the reactive props object.
  let props: {
    identity: string;
    path: string;
    sourceItem?: unknown;
    children: Snippet;
  } = $props();
  const parentDynamic = getContext<DynamicUiContext | undefined>(DynamicUiContextSymbol);
  const form = useJsonForms();
  if (parentDynamic)
    setContext<DynamicUiContext>(DynamicUiContextSymbol, {
      cache: parentDynamic.cache,
      get value() {
        return parentDynamic.value;
      },
      get item() {
        if (Object.hasOwn(props, 'sourceItem')) return props.sourceItem;
        return dataPathSegments(props.path).reduce<unknown>(
          (current, key) =>
            current && typeof current === 'object' && Object.hasOwn(current, key)
              ? (current as Record<string, unknown>)[key]
              : undefined,
          form.core?.data,
        );
      },
    });
  setContext<CollectionItemIdentity>(CollectionItemContextSymbol, {
    get key() {
      return props.identity;
    },
    get path() {
      return props.path;
    },
    get hasSourceItem() {
      return Object.hasOwn(props, 'sourceItem');
    },
    get sourceItem() {
      return props.sourceItem;
    },
  });
</script>

{@render props.children()}
