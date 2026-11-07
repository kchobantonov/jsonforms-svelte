<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import {
    CollectionItemContextSymbol,
    type CollectionItemIdentity,
  } from '../collectionItem.svelte';
  // eslint-disable-next-line svelte/no-unused-props -- Context getters read the reactive props object.
  let props: {
    identity: string;
    path: string;
    sourceItem?: unknown;
    children: Snippet;
  } = $props();
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
