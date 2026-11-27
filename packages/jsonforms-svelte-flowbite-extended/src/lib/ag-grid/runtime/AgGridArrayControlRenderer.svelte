<script module lang="ts">
  import { createGridStyleInstaller } from '@chobantonov/jsonforms-svelte-extended';
  import runtimeStyles from './ag-grid.css?inline';
  const acquireRuntimeStyles = createGridStyleInstaller(
    'jsonforms-flowbite-ag-grid-runtime-styles',
    runtimeStyles,
  );
</script>

<script lang="ts">
  import { CollectionPanelToggle } from '@chobantonov/jsonforms-svelte-flowbite';
  import { RowDetailToggle, DetailDialog } from '@chobantonov/jsonforms-svelte-flowbite';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-flowbite';
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Tooltip } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { type ControlElement } from '@jsonforms/core';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-flowbite';
  import { GridArrayLayout } from '@chobantonov/jsonforms-svelte-extended';
  import DispatchCellHost from './DispatchCellHost.svelte';
  import { useGridArrayControl } from '@chobantonov/jsonforms-svelte-extended';

  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const grid = useGridArrayControl(rendererProps, acquireRuntimeStyles);
  const { message, clearFilters, removeSelected, addItem } = grid;
</script>

<GridArrayLayout
  {grid}
  gridClass="jsonforms-ag-grid jsonforms-ag-grid--flowbite"
  errorClass="my-2 text-sm text-red-600 dark:text-red-400"
  {CollectionPanelToggle}
  {RowDetailToggle}
  compactToggle
  {RowDetailFrame}
  {DetailDialog}
  {ConfirmationDialog}
  cellHost={DispatchCellHost}
>
  {#snippet actions()}
    <span class="inline-flex">
      <Button
        type="button"
        size="sm"
        color="red"
        disabled={grid.removeDisabled}
        onclick={removeSelected}
        aria-label={grid.translations.removeAriaLabel}
        title={grid.translations.removeTooltip}><TrashBinOutline class="h-4 w-4" /></Button
      >
    </span><Tooltip>{grid.translations.removeTooltip}</Tooltip>
    <span class="inline-flex">
      <Button
        type="button"
        size="sm"
        disabled={grid.addDisabled}
        onclick={addItem}
        aria-label={grid.translations.addAriaLabel}
        title={grid.translations.addTooltip}><PlusOutline class="h-4 w-4" /></Button
      >
    </span><Tooltip>{grid.translations.addTooltip}</Tooltip>
  {/snippet}
  {#snippet clearButton()}
    <Button type="button" size="xs" color="alternative" onclick={clearFilters}
      >{message('collection.clearFilters')}</Button
    >
  {/snippet}
</GridArrayLayout>
