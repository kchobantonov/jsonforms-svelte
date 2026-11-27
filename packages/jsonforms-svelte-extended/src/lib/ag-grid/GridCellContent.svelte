<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import {
    OptionalCollectionItem,
    DispatchCell,
    RowDetailDialog,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { AgGridCellHostProps } from './types';
  const message = useRendererMessages();
  const {
    current,
    DetailDialog,
    ValidationIcon,
    selectButton,
  }: {
    current: AgGridCellHostProps;
    DetailDialog: ComponentProps<typeof RowDetailDialog>['Dialog'];
    ValidationIcon: Component<{ errors: ErrorObject[]; 'data-row-detail-errors': boolean }>;
    selectButton: Snippet<
      [
        {
          'aria-label': string;
          title: string;
          'aria-current'?: 'true';
          'data-row-detail-selected': boolean;
          onclick(): void;
        },
      ]
    >;
  } = $props();
</script>

<OptionalCollectionItem item={current.item}>
  {#if current.rowDetail}
    {@const detail = current.rowDetail}
    <span class="inline-flex items-center gap-1">
      {#if detail.options.presentation === 'dialog'}
        <RowDetailDialog
          Dialog={DetailDialog}
          schema={current.schema}
          path={current.path}
          scope={detail.scope}
          options={detail.options}
          enabled={current.enabled}
          index={detail.index}
          prepare={detail.prepare}
        />
      {:else}
        {@const label = message('collection.editRowDetails', { index: detail.index + 1 })}
        {@render selectButton({
          'aria-label': label,
          title: label,
          'aria-current': detail.selected ? 'true' : undefined,
          'data-row-detail-selected': detail.selected,
          onclick: detail.select,
        })}
      {/if}
      <ValidationIcon data-row-detail-errors errors={detail.errors} />
    </span>
  {:else}
    <DispatchCell {...current} />
  {/if}
</OptionalCollectionItem>
