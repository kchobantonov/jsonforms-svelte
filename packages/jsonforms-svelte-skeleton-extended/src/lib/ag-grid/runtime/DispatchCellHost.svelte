<script lang="ts">
  import { CollectionItem } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchCell,
    RowDetailDialog,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { DetailDialog, ValidationIcon } from '@chobantonov/jsonforms-svelte-skeleton';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

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
        <button
          type="button"
          class="btn btn-sm preset-outlined"
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
          ></button
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
