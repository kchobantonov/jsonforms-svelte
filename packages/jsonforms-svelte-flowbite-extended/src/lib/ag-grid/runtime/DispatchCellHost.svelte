<script lang="ts">
  import {
    DispatchCell,
    RowDetailDialog,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { DetailDialog } from '@chobantonov/jsonforms-svelte-flowbite';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  import { Button } from 'flowbite-svelte';
  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  const message = useRendererMessages();
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

{#if current.rowDetail?.options.presentation === 'dialog'}
  <RowDetailDialog
    Dialog={DetailDialog}
    schema={current.schema}
    path={current.path}
    scope={current.rowDetail.scope}
    options={current.rowDetail.options}
    enabled={current.enabled}
    index={current.rowDetail.index}
    prepare={current.rowDetail.prepare}
  />
{:else if current.rowDetail}
  <Button
    type="button"
    color="alternative"
    size="sm"
    aria-label={message('collection.editRowDetails', { index: current.rowDetail.index + 1 })}
    title={message('collection.editRowDetails', { index: current.rowDetail.index + 1 })}
    aria-current={current.rowDetail.selected ? 'true' : undefined}
    data-row-detail-selected={current.rowDetail.selected}
    onclick={current.rowDetail.select}
    ><svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5L16 3Z" /><path d="m14 5 5 5" /></svg
    ></Button
  >
{:else}
  <DispatchCell {...current} />
{/if}
