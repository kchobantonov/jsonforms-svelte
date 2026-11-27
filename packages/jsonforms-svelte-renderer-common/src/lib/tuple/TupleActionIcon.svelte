<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { TupleActionProps } from './tuplePresentation';
  const {
    icon,
    kind,
    Add,
    Delete,
  }: {
    icon?: Snippet;
    kind: TupleActionProps['kind'];
    Add: Component<{ class: string }>;
    Delete: Component<{ class: string }>;
  } = $props();
</script>

{#if icon}{@render icon()}{:else if kind === 'add'}<Add class="size-4" />{:else}<Delete
    class="size-4"
  />{/if}
