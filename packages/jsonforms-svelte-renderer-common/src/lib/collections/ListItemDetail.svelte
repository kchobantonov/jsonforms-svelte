<script lang="ts">
  import { composePaths } from '@jsonforms/core';
  import type { useJsonFormsArrayControl } from '../core/jsonFormsCompositions.svelte';
  import { findDetailUISchema } from '../core/detail';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import CollectionItem from './CollectionItem.svelte';

  const {
    control,
    selectedIndex,
  }: {
    control: ReturnType<typeof useJsonFormsArrayControl>['control'];
    selectedIndex: number;
  } = $props();
  const path = $derived(composePaths(control.path, String(selectedIndex)));
  const foundUISchema = $derived(
    findDetailUISchema(
      control.uischemas,
      control.schema,
      control.uischema.scope,
      control.path,
      undefined,
      control.uischema,
    ),
  );
</script>

<CollectionItem
  identity={control.rowKeys[selectedIndex]}
  {path}
  sourceItem={control.data[selectedIndex]}
>
  <DispatchRenderer
    schema={control.schema}
    uischema={foundUISchema}
    {path}
    enabled={control.enabled}
    renderers={control.renderers}
    cells={control.cells}
  />
</CollectionItem>
