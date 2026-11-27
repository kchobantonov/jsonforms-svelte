<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  type SearchInput = {
    type: 'text';
    value?: string;
    class: string;
    placeholder: string;
    'aria-label': string;
  };
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  const {
    view,
    attributes,
    Input,
    children,
  }: {
    view: ReturnType<typeof useMixedTreeView>;
    attributes: SearchInput;
    Input?: Component<SearchInput>;
    children: Snippet;
  } = $props();
</script>

{#if Input}
  <Input {...attributes} bind:value={view.searchQuery} />
{:else}
  <input {...attributes} bind:value={view.searchQuery} />
{/if}
{@render children()}
