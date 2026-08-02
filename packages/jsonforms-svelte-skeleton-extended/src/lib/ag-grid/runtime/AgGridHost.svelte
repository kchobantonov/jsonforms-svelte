<script lang="ts">
  import type { ColDef, GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';
  import { getAllContexts, onMount } from 'svelte';
  import type { AgGridCellHostProps, AgGridWrappedRow } from '../types.js';
  import { createGrid } from './ag-grid-runtime.js';
  import { toManagedGridOptions } from './initial-grid-options.js';

  let {
    options,
    rows,
    columns,
    getCellProps,
    onready,
  }: {
    options: GridOptions<AgGridWrappedRow>;
    rows: AgGridWrappedRow[];
    columns: ColDef<AgGridWrappedRow>[];
    getCellProps: (params: ICellRendererParams<AgGridWrappedRow>) => AgGridCellHostProps;
    onready?: (api: GridApi<AgGridWrappedRow>) => void;
  } = $props();

  const contexts = getAllContexts();
  let element: HTMLDivElement;
  let api = $state<GridApi<AgGridWrappedRow> | null>(null);
  let latestGetCellProps = $derived(getCellProps);

  onMount(() => {
    let active = true;
    createGrid(element, { ...options, rowData: rows, columnDefs: columns }, contexts, (params) =>
      latestGetCellProps(params),
    ).then((createdApi) => {
      if (!active) {
        createdApi.destroy();
        return;
      }
      api = createdApi;
      onready?.(createdApi);
    });
    return () => {
      active = false;
      api?.destroy();
      api = null;
    };
  });
  $effect(() => {
    if (api) api.setGridOption('rowData', rows);
  });
  $effect(() => {
    if (api) api.setGridOption('columnDefs', columns);
  });
  $effect(() => {
    if (api) api.updateGridOptions(toManagedGridOptions(options));
  });
</script>

<div bind:this={element} class="jsonforms-ag-grid-host"></div>

<style>
  .jsonforms-ag-grid-host {
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  :global(.jsonforms-ag-grid-cell-host) {
    width: 100%;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
  }
  :global(.jsonforms-ag-grid-cell-host > :not(dialog)) {
    width: 100%;
    min-width: 0;
  }
</style>
