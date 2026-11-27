<script module lang="ts">
  import { createGridStyleInstaller } from '@chobantonov/jsonforms-svelte-extended';
  import runtimeStyles from './ag-grid.css?inline';
  const acquireRuntimeStyles = createGridStyleInstaller(
    'jsonforms-shadcn-ag-grid-runtime-styles',
    runtimeStyles,
  );
</script>

<script lang="ts">
  import { CollectionPanelToggle } from '@chobantonov/jsonforms-svelte-shadcn';
  import { RowDetailToggle, DetailDialog, TupleAction } from '@chobantonov/jsonforms-svelte-shadcn';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-shadcn';
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { type ControlElement } from '@jsonforms/core';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-shadcn';
  import { GridArrayLayout } from '@chobantonov/jsonforms-svelte-extended';
  import DispatchCellHost from './DispatchCellHost.svelte';
  import { useGridArrayControl } from '@chobantonov/jsonforms-svelte-extended';

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  function configureCellOptions(options: Record<string, unknown>) {
    const shadcn = isRecord(options.shadcn) ? options.shadcn : {};
    const select = isRecord(shadcn['Select']) ? shadcn['Select'] : {};
    const content = isRecord(select['Content']) ? select['Content'] : {};

    options.shadcn = {
      ...shadcn,
      Select: {
        ...select,
        Content: { ...content, preventScroll: false },
      },
    };
  }
  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const grid = useGridArrayControl(rendererProps, acquireRuntimeStyles, configureCellOptions);
  const { message, clearFilters } = grid;
</script>

<GridArrayLayout
  {grid}
  gridClass="jsonforms-ag-grid jsonforms-ag-grid--shadcn"
  errorClass="text-destructive my-2 text-sm"
  {CollectionPanelToggle}
  {RowDetailToggle}
  {RowDetailFrame}
  {DetailDialog}
  {ConfirmationDialog}
  cellHost={DispatchCellHost}
>
  {#snippet actions()}
    <TupleAction {...grid.removeAction} buttonVariant="outline" />
    <TupleAction {...grid.addAction} />
  {/snippet}
  {#snippet clearButton()}
    <Button type="button" variant="link" onclick={clearFilters}
      >{message('collection.clearFilters')}</Button
    >
  {/snippet}
</GridArrayLayout>
