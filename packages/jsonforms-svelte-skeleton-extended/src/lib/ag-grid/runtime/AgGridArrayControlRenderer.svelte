<script module lang="ts">
  import { createGridStyleInstaller } from '@chobantonov/jsonforms-svelte-extended';
  import runtimeStyles from './ag-grid.css?inline';
  const acquireRuntimeStyles = createGridStyleInstaller(
    'jsonforms-skeleton-ag-grid-runtime-styles',
    runtimeStyles,
  );
</script>

<script lang="ts">
  import { CollectionPanelToggle } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    RowDetailToggle,
    DetailDialog,
    TupleAction,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-skeleton';
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-skeleton';
  import { GridArrayLayout } from '@chobantonov/jsonforms-svelte-extended';
  import DispatchCellHost from './DispatchCellHost.svelte';
  import { useGridArrayControl } from '@chobantonov/jsonforms-svelte-extended';

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  function configureCellOptions(options: Record<string, unknown>) {
    options.nativeSelect = true;
    const skeleton = isRecord(options.skeleton) ? options.skeleton : {};
    const datePicker = isRecord(skeleton['DatePicker']) ? skeleton['DatePicker'] : {};
    const positioning = isRecord(datePicker['positioning']) ? datePicker['positioning'] : {};
    options.skeleton = {
      ...skeleton,
      DatePicker: {
        ...datePicker,
        positioning: { boundary: [], ...positioning },
      },
    };
  }
  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const grid = useGridArrayControl(rendererProps, acquireRuntimeStyles, configureCellOptions);
  const { message, clearFilters } = grid;
</script>

<GridArrayLayout
  {grid}
  gridClass="jsonforms-ag-grid jsonforms-ag-grid--skeleton"
  errorClass="text-error-600 dark:text-error-400 my-2 text-sm"
  {CollectionPanelToggle}
  {RowDetailToggle}
  {RowDetailFrame}
  {DetailDialog}
  {ConfirmationDialog}
  cellHost={DispatchCellHost}
>
  {#snippet actions()}
    <TupleAction
      {...grid.removeAction}
      buttonClass="btn-icon preset-tonal hover:preset-filled-error-500 size-8"
    />
    <TupleAction {...grid.addAction} buttonClass="btn-icon preset-filled size-8" />
  {/snippet}
  {#snippet clearButton()}
    <button type="button" class="btn preset-tonal" onclick={clearFilters}
      >{message('collection.clearFilters')}</button
    >
  {/snippet}
</GridArrayLayout>
