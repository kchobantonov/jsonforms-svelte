<script lang="ts">
  import type { useJsonFormsLayout } from '../core/jsonFormsCompositions.svelte';
  type BoundLayout = ReturnType<typeof useJsonFormsLayout>['layout'];
  import type { Component } from 'svelte';
  import type { Layout } from '@jsonforms/core';
  import type { RendererProps } from '@chobantonov/jsonforms-svelte';
  const {
    layout,
    LayoutRenderer,
  }: { layout: BoundLayout; LayoutRenderer: Component<RendererProps<Layout>> } = $props();
</script>

<LayoutRenderer
  schema={layout.schema}
  uischema={{
    type: 'VerticalLayout',
    elements: layout.uischema.elements,
    options: layout.uischema.options,
  }}
  path={layout.path}
  enabled={layout.enabled}
  renderers={layout.renderers}
  cells={layout.cells}
/>
