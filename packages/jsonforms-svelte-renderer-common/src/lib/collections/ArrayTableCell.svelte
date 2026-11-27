<script lang="ts">
  import { composePaths } from '@jsonforms/core';
  import type { useJsonFormsArrayControl } from '../core/jsonFormsCompositions.svelte';
  import type { useArrayTable } from './arrayTable.svelte';
  import DispatchCell from '../core/DispatchCell.svelte';
  import LiteralControl from '../objects/LiteralControl.svelte';

  const {
    control,
    table,
    index,
    propName,
  }: {
    control: ReturnType<typeof useJsonFormsArrayControl>['control'];
    table: ReturnType<typeof useArrayTable>;
    index: number;
    propName: string;
  } = $props();

  const rowPath = $derived(composePaths(control.path, String(index)));
  const wholeRow = $derived(table.wholeRow(propName));
  const uischema = $derived(table.resolveUiSchema(propName));
</script>

{#if !wholeRow && (propName === '' || propName.includes('.') || propName.includes('\0') || ['__proto__', 'constructor', 'prototype'].includes(propName))}
  <LiteralControl
    schema={control.schema}
    {uischema}
    path={rowPath}
    enabled={control.enabled}
    renderers={control.renderers}
    cells={control.cells}
    cellMode
  />
{:else}
  <DispatchCell
    schema={table.resolveCellSchema(propName)}
    {uischema}
    path={composePaths(rowPath, wholeRow ? '' : propName)}
    enabled={control.enabled}
    renderers={control.renderers}
    cells={control.cells}
  />
{/if}
