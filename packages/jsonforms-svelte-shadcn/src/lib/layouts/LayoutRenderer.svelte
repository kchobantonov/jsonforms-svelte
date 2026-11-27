<script lang="ts">
  import {
    useJsonFormsLayout,
    PortableLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
</script>

<PortableLayout
  layout={binding.layout}
  classes={binding.layout.direction === 'row'
    ? binding.styles.horizontalLayout
    : binding.styles.verticalLayout}
/>
