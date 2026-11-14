<script lang="ts">
  import { CollectionItem } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchCell,
    RowDetailDialog,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { DetailDialog, ValidationIcon } from '@chobantonov/jsonforms-svelte-flowbite';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  import { Button, Tooltip } from 'flowbite-svelte';
  import { PenOutline } from 'flowbite-svelte-icons';
  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  const message = useRendererMessages();
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

{#snippet content()}
  {#if current.rowDetail}
    <span class="inline-flex items-center gap-1">
      {#if current.rowDetail.options.presentation === 'dialog'}
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
      {:else}
        <Button
          type="button"
          color="alternative"
          size="xs"
          aria-label={message('collection.editRowDetails', { index: current.rowDetail.index + 1 })}
          title={message('collection.editRowDetails', { index: current.rowDetail.index + 1 })}
          aria-current={current.rowDetail.selected ? 'true' : undefined}
          data-row-detail-selected={current.rowDetail.selected}
          onclick={current.rowDetail.select}
          ><PenOutline class="h-4 w-4" />
        </Button>
        <Tooltip
          >{message('collection.editRowDetails', { index: current.rowDetail.index + 1 })}</Tooltip
        >
      {/if}
      <ValidationIcon data-row-detail-errors errors={current.rowDetail.errors} />
    </span>
  {:else}
    <DispatchCell {...current} />
  {/if}
{/snippet}
{#key current.item?.key}
  {#if current.item}
    <CollectionItem
      identity={current.item.key}
      path={current.item.path}
      sourceItem={current.item.sourceItem}
      children={content}
    />
  {:else}
    {@render content()}
  {/if}
{/key}
