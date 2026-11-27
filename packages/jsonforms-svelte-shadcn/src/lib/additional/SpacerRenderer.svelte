<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
    LayoutSpacer,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
</script>

{#if binding.layout.visible}<LayoutSpacer uischema={props.uischema} />{/if}
