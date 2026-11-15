import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it('toggles the correct null source value after sorting without changing siblings', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [{ marker: null, name: 'Zulu' }, { name: 'Alpha' }];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { marker: { type: 'null' }, name: { type: 'string' } },
        },
      },
      data,
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const checkbox = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="0"] .ag-cell[col-id="marker"] input[type="checkbox"]',
    );
  await vi.waitFor(() => expect(checkbox()?.indeterminate).toBe(true));
  checkbox()!.click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { marker: null, name: 'Zulu' },
      { marker: null, name: 'Alpha' },
    ]),
  );
  await vi.waitFor(() => expect(checkbox()?.checked).toBe(true));
  checkbox()!.click();
  await vi.waitFor(() => {
    const rows = onchange.mock.lastCall?.[0].data;
    expect(rows).toEqual([{ marker: null, name: 'Zulu' }, { name: 'Alpha' }]);
    expect(Object.hasOwn(rows[1], 'marker')).toBe(false);
  });
  expect(data[1]).toEqual({ name: 'Alpha' });
});
