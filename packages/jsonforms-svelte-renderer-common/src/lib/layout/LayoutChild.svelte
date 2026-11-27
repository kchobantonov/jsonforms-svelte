<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  import type { useJsonFormsLayout } from '../core/jsonFormsCompositions.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';

  const {
    layout,
    uischema,
  }: {
    layout: ReturnType<typeof useJsonFormsLayout>['layout'];
    uischema: UISchemaElement;
  } = $props();
</script>

<DispatchRenderer
  schema={layout.schema}
  {uischema}
  path={layout.path}
  enabled={layout.enabled}
  renderers={layout.renderers}
  cells={layout.cells}
/>
