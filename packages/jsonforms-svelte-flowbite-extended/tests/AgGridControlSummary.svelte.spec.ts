import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import '../../jsonforms-svelte-flowbite/tests/test.css';

afterEach(cleanup);

it('filters and sorts the visible Control summary instead of the raw composite value', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const data = [
    { contact: { city: 'Boston', phone: '1' } },
    { contact: { city: 'Austin', phone: '2' } },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            contact: {
              type: 'object',
              title: 'Contact',
              properties: { city: { type: 'string' }, phone: { type: 'string' } },
            },
          },
        },
      },
      data,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          cells: { contact: { summary: { type: 'Control', scope: '#/properties/city' } } },
          agGridOptions: {
            defaultColDef: { filter: 'agTextColumnFilter', sortable: true },
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
      cells: [...flowbiteExtendedCells, ...flowbiteCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  const value = (index: number) =>
    api!.getCellValue({ rowNode: api!.getDisplayedRowAtIndex(index)!, colKey: 'contact' });
  await vi.waitFor(() => expect(value(0)).toBe('Boston'));
  expect(value(1)).toBe('Austin');
  expect(
    view.container.querySelector('.ag-row[row-index="0"] .ag-cell[col-id="contact"]')?.textContent,
  ).toContain('Boston');
  api!.applyColumnState({ state: [{ colId: 'contact', sort: 'asc' }] });
  await vi.waitFor(() => expect(value(0)).toBe('Austin'));
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual(data[1]);
  api!.setFilterModel({ contact: { filterType: 'text', type: 'contains', filter: 'Boston' } });
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
  expect(value(0)).toBe('Boston');
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual(data[0]);
});
