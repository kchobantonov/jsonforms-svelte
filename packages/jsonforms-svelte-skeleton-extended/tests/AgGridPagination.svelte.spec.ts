import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
afterEach(cleanup);

it('sorts and filters the full collection before paging while edits keep source identity', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = ['Echo', 'Bravo', 'Delta', 'Alpha', 'Charlie'].map((name) => ({ name }));
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      data,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            pagination: true,
            paginationPageSize: 2,
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange,
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(5));
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
  api!.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'a' } });
  api!.onFilterChanged();
  await vi.waitFor(() =>
    expect(
      Array.from(
        { length: api!.getDisplayedRowCount() },
        (_, index) => api!.getDisplayedRowAtIndex(index)?.data?.sourceIndex,
      ),
    ).toEqual([3, 1, 4, 2]),
  );
  expect(api!.paginationGetTotalPages()).toBe(2);
  api!.paginationGoToPage(1);
  const editor = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="2"] .ag-cell[col-id="name"] input',
    );
  await vi.waitFor(() => expect(editor()?.value).toBe('Charlie'));
  editor()!.value = 'Charly';
  editor()!.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { name: 'Echo' },
      { name: 'Bravo' },
      { name: 'Delta' },
      { name: 'Alpha' },
      { name: 'Charly' },
    ]),
  );
  expect(data[4].name).toBe('Charlie');
});

it('jumps from the short array notice to the first invalid row across grid pages', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
      },
      data: [
        ...Array.from({ length: 6 }, (_, index) => ({ name: `Person ${index + 1}` })),
        { name: 'x' },
      ],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            pagination: true,
            paginationPageSize: 2,
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
      onchange,
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(7));
  onchange.mockClear();
  expect(api!.paginationGetCurrentPage()).toBe(0);
  const jump = view.container.querySelector<HTMLButtonElement>('[data-array-summary] button')!;
  expect(jump.textContent?.trim()).toBe('Go to first error');
  jump.click();
  await vi.waitFor(() => expect(api!.paginationGetCurrentPage()).toBe(3));
  expect(api!.getDisplayedRowAtIndex(6)?.data?.sourceIndex).toBe(6);

  api!.paginationGoToPage(0);
  api!.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Person' } });
  api!.onFilterChanged();
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(6));
  jump.click();
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(7));
  await vi.waitFor(() => expect(api!.paginationGetCurrentPage()).toBe(3));
  expect(onchange).not.toHaveBeenCalled();
  expect(api!.getFilterModel()).toEqual({});

  api!.paginationGoToPage(0);
  api!.setGridOption('quickFilterText', 'Person');
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(6));
  jump.click();
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(7));
  await vi.waitFor(() => expect(api!.paginationGetCurrentPage()).toBe(3));
  expect(onchange).not.toHaveBeenCalled();
});

it('reveals sorted added rows and explains when column or quick filters hide one', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onRowDataUpdated = vi.fn();
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' } },
          default: { name: 'new' },
        },
      },
      data: Array.from({ length: 5 }, (_, index) => ({ name: `Person ${index + 1}` })),
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            pagination: true,
            paginationPageSize: 2,
            paginationPageSizeSelector: [2, 5],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
            onRowDataUpdated,
          },
        },
      },
      onchange,
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(5));
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'desc' }] });
  const add = view.container.querySelector<HTMLButtonElement>(
    '.jsonforms-ag-grid__actions button[aria-label="Add button"]',
  )!;
  add.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toHaveLength(6));
  await vi.waitFor(() => {
    let newRowIndex: number | null = null;
    api!.forEachNode((node) => {
      if (node.data?.sourceIndex === 5) newRowIndex = node.rowIndex;
    });
    expect(newRowIndex).not.toBeNull();
    expect(api!.paginationGetCurrentPage()).toBe(Math.floor(newRowIndex! / 2));
  });
  expect(onRowDataUpdated).toHaveBeenCalled();

  api!.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Person' } });
  api!.onFilterChanged();
  add.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toHaveLength(7));
  await vi.waitFor(() =>
    expect(view.container.querySelector('[role="status"]')?.textContent).toContain(
      'The new item is hidden by the current filter.',
    ),
  );
  const clear = [
    ...view.container.querySelectorAll<HTMLButtonElement>('[role="status"] button'),
  ].find((button) => button.textContent?.includes('Clear filters'))!;
  clear.click();
  await vi.waitFor(() => expect(api!.isAnyFilterPresent()).toBe(false));
  await vi.waitFor(() => expect(view.container.querySelector('[role="status"]')).toBeNull());

  api!.setGridOption('quickFilterText', 'Person');
  add.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toHaveLength(8));
  await vi.waitFor(() => expect(view.container.querySelector('[role="status"]')).not.toBeNull());
  view.container.querySelector<HTMLButtonElement>('[role="status"] button')!.click();
  await vi.waitFor(() => expect(api!.getGridOption('quickFilterText')).toBe(''));
  await vi.waitFor(() => expect(view.container.querySelector('[role="status"]')).toBeNull());
});

it('uses flat native grid options, local bag replacement, and ignores the removed nested bag', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (agGridOptions?: Record<string, unknown>) => ({
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid', ...(agGridOptions ? { agGridOptions } : {}) },
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      data: Array.from({ length: 8 }, (_, index) => ({ name: `Person ${index + 1}` })),
      uischema: control(),
      config: {
        agGridOptions: { onGridReady, pagination: false },
        jsonformsExtended: { agGridOptions: { pagination: true } },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api).toBeDefined());
  expect(api!.getGridOption('pagination')).toBe(false);
  await view.rerender({
    uischema: control({ onGridReady, pagination: true, paginationPageSize: 4 }),
  });
  await vi.waitFor(() => expect(api!.getGridOption('pagination')).toBe(true));
  expect(api!.paginationGetPageSize()).toBe(4);
});

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
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
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
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
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
    uischema: control({
      columnDefs: portable,
      agGridOptions: { onGridReady, columnDefs: [{ colId: 'name', headerName: 'Name override' }] },
    }),
  });
  await vi.waitFor(() =>
    expect(api!.getCellValue({ rowNode: api!.getDisplayedRowAtIndex(0)!, colKey: 'name' })).toBe(
      'Ada',
    ),
  );
  expect(view.container.querySelector('.ag-cell[col-id="name"] input')).not.toBeNull();
  expect(api!.getColumn('name')?.getColDef().headerName).toBe('Name override');
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

it('keeps the generated primitive value cell under a colId-only native override', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'array', items: { type: 'string' } },
      data: ['Alpha', 'Beta'],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ colId: 'value', headerName: 'Native value' }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() =>
    expect(api?.getCellValue({ rowNode: api.getDisplayedRowAtIndex(0)!, colKey: 'value' })).toBe(
      'Alpha',
    ),
  );
  expect(api!.getColumn('value')?.getColDef().headerName).toBe('Native value');
  expect(view.container.querySelector('.ag-cell[col-id="value"] input')).not.toBeNull();
});

it('does not add a second drag column when native definitions already provide one', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (columnDefs: unknown[]) => ({
    type: 'Control',
    scope: '#',
    options: {
      variant: 'ag-grid',
      showSortButtons: true,
      agGridOptions: { onGridReady, columnDefs },
    },
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      data: [{ name: 'Ada' }, { name: 'Bea' }],
      uischema: control([{ colId: 'name', rowDrag: true }]),
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  const dragCount = () =>
    api?.getAllGridColumns().filter((column) => column.getColDef().rowDrag).length;
  await vi.waitFor(() => expect(dragCount()).toBe(1));
  expect(api!.getColumnDefs()).toHaveLength(1);
  await view.rerender({
    uischema: control([{ groupId: 'person', children: [{ colId: 'name', rowDrag: true }] }]),
  });
  await vi.waitFor(() => expect(api!.getColumnGroup('person')).toBeTruthy());
  expect(dragCount()).toBe(1);
  expect(api!.getColumnDefs()).toHaveLength(1);
  await view.rerender({
    uischema: control([{ colId: 'computed', valueGetter: () => 'A', rowDrag: true }]),
  });
  await vi.waitFor(() => expect(api!.getColumn('computed')).toBeTruthy());
  expect(dragCount()).toBe(1);
  expect(api!.getColumnDefs()).toHaveLength(1);
  await view.rerender({ uischema: control([{ field: 'name' }]) });
  await vi.waitFor(() => expect(dragCount()).toBe(1));
  expect(api!.getColumnDefs()).toHaveLength(2);
});
