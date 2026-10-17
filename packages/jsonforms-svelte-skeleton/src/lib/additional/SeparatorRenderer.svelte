<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const vertical = $derived(binding.appliedOptions.vertical === true);
</script>

{#if binding.layout.visible}{#if vertical}<div
      role="separator"
      aria-orientation="vertical"
      class="vr shrink-0"
    ></div>{:else}<hr class="hr" aria-orientation="horizontal" />{/if}{/if}
