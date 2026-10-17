<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';
  import { Hr } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const vertical = $derived(binding.appliedOptions.vertical === true);
</script>

{#if binding.layout.visible}<Hr
    aria-orientation={vertical ? 'vertical' : 'horizontal'}
    class={vertical ? 'my-0 h-full w-px shrink-0' : 'my-0'}
  />{/if}
