<script lang="ts">
  import {
    CollectionItem,
    DispatchRenderer,
    useJsonForms,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';

  const props: RendererProps = $props();
  const form = useJsonForms();
  const sourceItem = $derived(
    ((form.core?.data as Record<string, unknown>)?.['a.b'] as unknown[] | undefined)?.[0],
  );
  const label: LabelElement = {
    type: 'Label',
    text: 'Item: {name}',
    options: { interpolate: true, textParams: { name: '{item.name}' } },
  };
</script>

<CollectionItem identity="literal-row" path="a.b.0" {sourceItem}>
  <div data-testid="literal-row-label">
    <DispatchRenderer schema={props.schema} uischema={label} path="a.b.0" />
  </div>
</CollectionItem>
