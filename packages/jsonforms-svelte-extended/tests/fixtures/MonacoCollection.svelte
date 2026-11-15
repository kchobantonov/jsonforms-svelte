<script lang="ts">
  import {
    CollectionItem,
    DispatchRenderer,
    useJsonFormsArrayControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { composePaths } from '@jsonforms/core';
  import { onMount } from 'svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsArrayControl(props);
  onMount(() => props.uischema.options?.captureArray?.(binding));
</script>

{#each binding.control.rowKeys as identity, index (identity)}
  <CollectionItem {identity} path={composePaths(binding.control.path, String(index))}>
    <DispatchRenderer
      schema={binding.control.schema}
      uischema={{ type: 'Control', scope: '#', options: props.uischema.options }}
      path={composePaths(binding.control.path, String(index))}
      renderers={binding.control.renderers}
      cells={binding.control.cells}
    />
  </CollectionItem>
{/each}
