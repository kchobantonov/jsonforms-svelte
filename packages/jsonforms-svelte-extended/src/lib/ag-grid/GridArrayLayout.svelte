<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import { composePaths } from '@jsonforms/core';
  import {
    arrayChildNotice,
    RowDetailDialog,
    type RowDetailFrameProps,
    type ConfirmationOperation,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import AgGridHost from './AgGridHost.svelte';
  import type { useGridArrayControl } from './gridArrayControl.svelte';
  let {
    grid,
    gridClass,
    errorClass,
    actions,
    clearButton,
    cellHost,
    CollectionPanelToggle,
    RowDetailToggle,
    compactToggle = false,
    RowDetailFrame,
    DetailDialog,
    ConfirmationDialog,
  }: {
    grid: ReturnType<typeof useGridArrayControl>;
    gridClass: string;
    errorClass: string;
    actions: Snippet<[string]>;
    compactToggle?: boolean;
    CollectionPanelToggle?: Component<{
      panel: ReturnType<typeof useGridArrayControl>['panel'];
      id: string;
      label: string;
      compact?: boolean;
    }>;
    RowDetailToggle?: Component<{
      open: boolean;
      disabled: boolean;
      onclick(): void;
      label: string;
    }>;
    clearButton: Snippet;
    cellHost: ComponentProps<typeof AgGridHost>['cellHost'];
    RowDetailFrame: Component<RowDetailFrameProps>;
    DetailDialog: ComponentProps<typeof RowDetailDialog>['Dialog'];
    ConfirmationDialog: Component<{
      operation: ConfirmationOperation;
      onAccept: () => void;
      onCancel: () => void;
    }>;
  } = $props();
  const panelContentId = $props.id();
  const {
    binding,
    panel,
    message,
    rowDetail,
    gridColumns,
    getCellProps,
    deletion,
    prepare,
    revealFirstError,
  } = $derived(grid);
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class={errorClass}>
      {binding.control.errors}
    </p>
  {/if}
  {#if grid.childErrorCount > 0 && !grid.appliedOptions.hideArraySummaryValidation && grid.appliedOptions.showValidationIndicator !== false}
    <p role="alert" data-array-summary class={errorClass}>
      <span data-array-summary-message
        >{arrayChildNotice(
          grid.childErrorCount,
          grid.appliedOptions.showValidationIndicatorCount === true,
          message,
        )}</span
      >
      {#if grid.firstInvalidIndex !== undefined}
        <button type="button" class="ms-2 underline" onclick={revealFirstError}
          >{message('collection.firstError')}</button
        >
      {/if}
    </p>
  {/if}
  <section
    bind:this={grid.sectionElement}
    class={gridClass}
    style:width="100%"
    data-jsonforms-ag-grid
  >
    <header class="jsonforms-ag-grid__toolbar">
      <div class="jsonforms-ag-grid__title-row">
        <h3 class="jsonforms-ag-grid__title">{grid.computedLabel}</h3>
      </div>

      <div class="jsonforms-ag-grid__actions">
        {#if CollectionPanelToggle}<CollectionPanelToggle
            {panel}
            id={panelContentId}
            label={grid.computedLabel}
            compact={compactToggle}
          />{/if}
        {#if RowDetailToggle && rowDetail.options?.presentation === 'panel'}
          <RowDetailToggle
            open={rowDetail.panelOpen}
            disabled={false}
            onclick={rowDetail.toggle}
            label={message(
              rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails',
            )}
          />
        {/if}
        {@render actions(panelContentId)}
      </div>
    </header>

    <div
      id={panelContentId}
      hidden={panel.collapsed}
      style:display={panel.collapsed ? 'none' : 'block'}
    >
      {#if grid.addedHidden}
        <div role="status" class="jsonforms-ag-grid__added-hidden">
          {message('collection.addedHidden')}
          {@render clearButton()}
        </div>
      {/if}

      <RowDetailFrame
        panel={rowDetail}
        schema={binding.control.schema}
        path={binding.control.path}
        scope={binding.control.uischema.scope}
        enabled={binding.control.enabled}
        height={binding.control.uischema.options?.layout?.height}
      >
        <div
          class="jsonforms-ag-grid__body"
          style:height={rowDetail.visible ? '100%' : grid.bodyHeight}
        >
          {#if grid.rows.length > 0}
            {#key grid.appliedLocalization}
              <AgGridHost
                {cellHost}
                options={grid.gridOptions}
                rows={grid.rows}
                columns={gridColumns.columns}
                {getCellProps}
                onready={grid.onready}
                readState={grid.readState}
                saveState={grid.saveState}
              />
            {/key}
          {:else}
            <p class="jsonforms-ag-grid__empty">{grid.translations.noDataMessage}</p>
          {/if}
        </div>
      </RowDetailFrame>
    </div>
  </section>
  {#if grid.errorDialogIndex !== undefined && rowDetail.options?.presentation === 'dialog'}
    <div bind:this={grid.errorDialogHost} class="sr-only">
      <RowDetailDialog
        Dialog={DetailDialog}
        schema={binding.control.schema}
        path={composePaths(binding.control.path, `${grid.errorDialogIndex}`)}
        scope={binding.control.uischema.scope}
        options={rowDetail.options}
        enabled={binding.control.enabled}
        index={grid.errorDialogIndex}
        {prepare}
        returnFocus={grid.errorDialogReturnFocus}
      />
    </div>
  {/if}
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation={deletion.pending.operation}
    onAccept={deletion.accept}
    onCancel={deletion.cancel}
  />
{/if}
