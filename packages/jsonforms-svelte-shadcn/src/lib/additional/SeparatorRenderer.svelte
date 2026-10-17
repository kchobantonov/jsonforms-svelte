<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';
  import Separator from '@jsonforms-svelte-shadcn-ui/separator/separator.svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
  const vertical = $derived(binding.appliedOptions.vertical === true);
</script>

{#if binding.layout.visible}<Separator
    orientation={vertical ? 'vertical' : 'horizontal'}
    decorative={false}
  />{/if}
