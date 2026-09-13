<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const height = $derived(
    typeof binding.appliedOptions.height === 'number' &&
      Number.isFinite(binding.appliedOptions.height)
      ? Math.max(0, binding.appliedOptions.height)
      : 32,
  );
</script>

{#if binding.layout.visible}<div
    aria-hidden="true"
    style:height={`${height}px`}
    style:flex-shrink="0"
  ></div>{/if}
