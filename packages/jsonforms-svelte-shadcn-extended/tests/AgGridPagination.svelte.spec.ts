import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
afterEach(cleanup);

it('maps portable pagination and retains independent native false/size overrides', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (options: Record<string, unknown>) => ({
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid', ...options },
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      data: Array.from({ length: 12 }, (_, index) => ({ name: `Person ${index + 1}` })),
      uischema: control({ agGridOptions: { onGridReady } }),
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
      cells: [...shadcnCells, ...shadcnExtendedCells],
      i18n: { locale: 'bg' },
    },
  });
  await vi.waitFor(() => expect(api?.paginationGetPageSize()).toBe(5));
  expect(api!.getGridOption('pagination')).toBe(true);
  expect(view.container.querySelector('[aria-label="Следваща страница"]')).not.toBeNull();
  await view.rerender({
    config: {
      jsonformsExtended: { array: { pagination: { pageSize: 2, pageSizeOptions: [2, 4] } } },
    },
  });
  await vi.waitFor(() => expect(api!.paginationGetPageSize()).toBe(2));
  expect(api!.getGridOption('paginationPageSizeSelector')).toEqual([2, 4]);
  await view.rerender({
    uischema: control({
      pagination: { pageSize: 3, pageSizeOptions: [3, 6] },
      agGridOptions: { onGridReady, pagination: false, paginationPageSize: 8 },
    }),
  });
  await vi.waitFor(() => expect(api!.getGridOption('pagination')).toBe(false));
  expect(api!.paginationGetPageSize()).toBe(8);
  expect(api!.getGridOption('paginationPageSizeSelector')).toEqual([3, 6]);
  await view.rerender({
    uischema: control({
      pagination: false,
      agGridOptions: { onGridReady, pagination: true, paginationPageSizeSelector: false },
    }),
  });
  await vi.waitFor(() => expect(api!.getGridOption('pagination')).toBe(true));
  expect(api!.getGridOption('paginationPageSizeSelector')).toBe(false);
});

it('selects portable columns and preserves native order, empty lists, groups and computed columns', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (options: Record<string, unknown>) => ({
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid', ...options },
  });
  const portable = [
    { field: 'email', width: 190 },
    { field: 'name' },
    { field: 'email', width: 300 },
    { field: 'unknown' },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      },
      data: [{ name: 'Ada', email: 'ada@example.com', notes: 'Preserve me' }],
      uischema: control({ columnDefs: portable, agGridOptions: { onGridReady } }),
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
      cells: [...shadcnCells, ...shadcnExtendedCells],
    },
  });
  const columns = () =>
    api?.getColumnDefs()?.map((column) => ('field' in column ? column.field : undefined));
  await vi.waitFor(() => expect(columns()).toEqual(['email', 'name']));
  expect(api!.getColumn('email')?.getActualWidth()).toBe(190);
  await view.rerender({
    uischema: control({
      columnDefs: portable,
      agGridOptions: { onGridReady, columnDefs: [{ field: 'name' }, { field: 'email' }] },
    }),
  });
  await vi.waitFor(() => expect(columns()).toEqual(['name', 'email']));
  await view.rerender({
    uischema: control({ columnDefs: portable, agGridOptions: { onGridReady, columnDefs: [] } }),
  });
  await vi.waitFor(() => expect(columns()).toEqual([]));
  await view.rerender({
    uischema: control({
      agGridOptions: {
        onGridReady,
        columnDefs: [
          { groupId: 'contact', headerName: 'Contact', children: [{ field: 'email' }] },
          { colId: 'computed', valueGetter: () => 'constant' },
        ],
      },
    }),
  });
  await vi.waitFor(() => expect(api!.getColumnGroup('contact')).toBeTruthy());
  expect(api!.getCellValue({ rowNode: api!.getDisplayedRowAtIndex(0)!, colKey: 'computed' })).toBe(
    'constant',
  );
  expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual({
    name: 'Ada',
    email: 'ada@example.com',
    notes: 'Preserve me',
  });
  await view.rerender({
    uischema: control({
      columnDefs: [{ field: 'row', scope: '#' }],
      cells: { row: { summary: { type: 'Control', scope: '#/properties/name' } } },
      agGridOptions: { onGridReady },
    }),
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('.ag-cell[col-id="row"]')?.textContent).toContain('Ada'),
  );
});
