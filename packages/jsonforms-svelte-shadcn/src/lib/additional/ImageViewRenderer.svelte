<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
  const src = $derived(
    typeof binding.appliedOptions.src === 'string' ? binding.appliedOptions.src : '',
  );
  const alt = $derived(
    typeof binding.appliedOptions.alt === 'string' ? binding.appliedOptions.alt : '',
  );
</script>

{#if binding.layout.visible}{#if src}<img {src} {alt} class="max-w-full h-auto" />{/if}{/if}
