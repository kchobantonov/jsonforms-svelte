<script lang="ts">
  import { useJsonFormsLayout, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
</script>

{#if binding.layout.visible}<hr class="hr" />{/if}
