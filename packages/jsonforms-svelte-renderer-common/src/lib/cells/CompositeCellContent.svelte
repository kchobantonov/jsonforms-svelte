<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import type { useCompositeCell } from './compositeCell.svelte';
  import type { ConfirmationOperation } from '../interaction/confirmation';
  import type { DetailDialogProps } from '../tuple/tuplePresentation';
  const {
    cell,
    CellContent,
    DetailDialog,
    ConfirmationDialog,
    removeButton,
    styleClearButton = false,
  }: {
    cell: ReturnType<typeof useCompositeCell>;
    CellContent: Component<{ errors?: string; children: Snippet }>;
    DetailDialog: Component<DetailDialogProps>;
    ConfirmationDialog: Component<{
      operation: ConfirmationOperation;
      onAccept: () => void;
      onCancel: () => void;
    }>;
    removeButton: Snippet;
    styleClearButton?: boolean;
  } = $props();
  const { binding, clearActions, message } = $derived(cell);
  const {
    labelSummary,
    rowBoundLabel,
    showEditor,
    showTypeIndicator,
    label,
    summary,
    detail,
    errors,
    detailOptions,
    dialogOptions,
    showRemove,
  } = $derived(cell);
</script>

<CellContent {errors}>
  <div class="composite-cell" class:custom-clear={styleClearButton} data-composite-cell>
    {#if showTypeIndicator}
      <span aria-hidden="true" data-composite-type
        >{Array.isArray(binding.cell.data) || binding.cell.schema.type === 'array'
          ? '[]'
          : '{}'}</span
      >
    {/if}
    <div
      class="composite-summary"
      class:generated={summary.generated && !labelSummary}
      data-composite-summary
    >
      {#if labelSummary}
        <DispatchRenderer
          schema={binding.cell.schema}
          uischema={labelSummary}
          path={binding.cell.path}
          enabled={false}
          renderers={binding.cell.renderers}
          cells={binding.cell.cells}
        />
      {:else}{summary.text}{/if}
    </div>
    <div class="composite-actions">
      {#if showEditor}
        <DetailDialog
          inspectable
          confirmationCatalogId="compositeCell"
          {label}
          title={binding.cell.schema.title !== undefined
            ? label
            : message('composite.detailsTitle')}
          enabled={clearActions.enabled}
          path={binding.cell.path}
          schema={binding.cell.schema}
          options={detailOptions}
          {dialogOptions}
          allowRemove={clearActions.canRemove && !rowBoundLabel}
        >
          <DispatchRenderer
            schema={binding.cell.schema}
            uischema={detail}
            path={binding.cell.path}
            enabled={clearActions.enabled}
            renderers={binding.cell.renderers}
            cells={binding.cell.cells}
          />
        </DetailDialog>
      {/if}
      {#if showRemove}{@render removeButton()}{/if}
    </div>
  </div>
</CellContent>

{#if clearActions.pending && binding.cell.visible}
  <ConfirmationDialog
    operation={clearActions.pending.operation}
    onAccept={clearActions.accept}
    onCancel={clearActions.cancel}
  />
{/if}

<style>
  .composite-cell {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .composite-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: text;
    cursor: text;
  }
  .composite-summary.generated {
    opacity: 0.65;
    font-style: italic;
  }
  .composite-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: none;
    opacity: 0;
  }
  .composite-cell:hover .composite-actions,
  .composite-cell:focus-within .composite-actions {
    opacity: 1;
    pointer-events: auto;
  }
  .composite-cell.custom-clear :global(.composite-clear) {
    opacity: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .composite-cell.custom-clear:hover :global(.composite-clear),
  .composite-cell.custom-clear:focus-within :global(.composite-clear) {
    opacity: 1;
  }
  .composite-cell.custom-clear :global(.composite-clear):disabled {
    cursor: not-allowed;
  }
  .composite-cell.custom-clear:hover :global(.composite-clear):disabled,
  .composite-cell.custom-clear:focus-within :global(.composite-clear):disabled {
    opacity: 0.4;
  }
  .composite-cell.custom-clear :global(.composite-clear):hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }
  .composite-cell.custom-clear :global(.composite-clear):focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
  @media (hover: none) {
    .composite-actions {
      opacity: 1;
      pointer-events: auto;
    }
    .composite-cell.custom-clear :global(.composite-clear) {
      opacity: 1;
    }
  }
</style>
