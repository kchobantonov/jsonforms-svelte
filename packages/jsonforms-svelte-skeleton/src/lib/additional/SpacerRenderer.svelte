<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
    LayoutSpacer,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
</script>

{#if binding.layout.visible}<LayoutSpacer uischema={props.uischema} />{/if}
