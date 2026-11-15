import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';

afterEach(cleanup);

it('marks required generated and nested native headers with local and per-cell overrides', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const schema = {
    type: 'array',
    items: {
      type: 'object',
      required: ['name', 'notes'],
      properties: { name: { type: 'string' }, notes: { type: 'string' } },
    },
  };
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (options: Record<string, unknown> = {}) => ({
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid', agGridOptions: { onGridReady }, ...options },
  });
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ name: 'Ada', notes: 'Present' }],
      uischema: control(),
      config: { hideRequiredAsterisk: false },
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
    },
  });
  await vi.waitFor(() => expect(api?.getColumn('name')?.getColDef().headerName).toBe('Name *'));
  expect(api!.getColumn('notes')!.getColDef().headerName).toBe('Notes *');

  await view.rerender({
    uischema: control({
      hideRequiredAsterisk: false,
      cells: { notes: { hideRequiredAsterisk: true } },
      agGridOptions: {
        onGridReady,
        columnDefs: [
          {
            headerName: 'Details',
            children: [{ field: 'name', headerName: 'Person' }, { field: 'notes' }],
          },
        ],
      },
    }),
  });
  await vi.waitFor(() => expect(api?.getColumn('name')?.getColDef().headerName).toBe('Person *'));
  expect(api!.getColumn('notes')!.getColDef().headerName).toBe('Notes');

  await view.rerender({
    uischema: control({
      hideRequiredAsterisk: true,
      cells: { notes: { hideRequiredAsterisk: false } },
      agGridOptions: {
        onGridReady,
        columnDefs: [
          {
            headerName: 'Details',
            children: [{ field: 'name', headerName: 'Person' }, { field: 'notes' }],
          },
        ],
      },
    }),
  });
  await vi.waitFor(() => expect(api?.getColumn('name')?.getColDef().headerName).toBe('Person'));
  expect(api!.getColumn('notes')!.getColDef().headerName).toBe('Notes *');
});
