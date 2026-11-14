import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it('filters and sorts cron expressions while retaining compact editors and source rows', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [{ schedule: '0 0 11 * * *' }, { schedule: '0 0 10 * * *' }];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { schedule: { type: 'string', format: 'cron' } },
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
  expect(api!.getCellValue({ rowNode: api!.getDisplayedRowAtIndex(0)!, colKey: 'schedule' })).toBe(
    '0 0 11 * * *',
  );
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-cron-input] input')).toHaveLength(2),
  );
  api!.setGridOption('quickFilterText', '11');
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
  expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[0]);
  api!.setGridOption('quickFilterText', '');
  api!.applyColumnState({ state: [{ colId: 'schedule', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="0"] [data-cron-input] input',
    );
  await vi.waitFor(() => expect(sortedInput()?.value).toBe('0 0 10 * * *'));
  sortedInput()!.focus();
  sortedInput()!.value = '0 0 10 * * invalid';
  sortedInput()!.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(sortedInput()?.getAttribute('aria-invalid')).toBe('true'));
  expect(document.activeElement).toBe(sortedInput());
  expect(
    view.container
      .querySelector('.ag-row[row-index="0"]')
      ?.querySelector('button[aria-label*="Invalid day of week field."]'),
  ).not.toBeNull();
  expect(
    view.container
      .querySelector('.ag-row[row-index="1"]')
      ?.querySelector('button[aria-label*="Invalid day of week field."]'),
  ).toBeNull();
  expect(
    view.container
      .querySelector<HTMLInputElement>('.ag-row[row-index="1"] [data-cron-input] input')
      ?.getAttribute('aria-invalid'),
  ).not.toBe('true');
  sortedInput()!.value = '0 0 12 * * *';
  sortedInput()!.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.calls.at(-1)?.[0].data).toEqual([
      { schedule: '0 0 11 * * *' },
      { schedule: '0 0 12 * * *' },
    ]),
  );
  await vi.waitFor(() =>
    expect(
      view.container.querySelector('button[aria-label*="Invalid day of week field."]'),
    ).toBeNull(),
  );
  expect(data).toEqual([{ schedule: '0 0 11 * * *' }, { schedule: '0 0 10 * * *' }]);
});
