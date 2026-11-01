import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it('edits the correct numeric source row after sorting and scopes its error', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [
    { quantity: 4, name: 'first' },
    { quantity: 3, name: 'second' },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quantity: { type: 'integer', minimum: 2 },
            name: { type: 'string' },
          },
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
      config: { restrict: false },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'quantity', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>('.ag-row[row-index="0"] input[type="number"]');
  await vi.waitFor(() => expect(sortedInput()?.value).toBe('3'));
  const input = sortedInput()!;
  input.focus();
  input.value = '1';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { quantity: 4, name: 'first' },
      { quantity: 1, name: 'second' },
    ]),
  );
  await vi.waitFor(() =>
    expect(input.closest('.ag-row')?.querySelector('.cell-invalid')).not.toBeNull(),
  );
  expect(view.container.querySelector('.ag-row[row-index="1"] .cell-invalid')).toBeNull();
  expect(document.activeElement).toBe(input);
  expect(data[1].quantity).toBe(3);
  input.value = '5';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { quantity: 4, name: 'first' },
      { quantity: 5, name: 'second' },
    ]),
  );
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(1)?.data?.value).toEqual({ quantity: 5, name: 'second' }),
  );
  expect(view.container.querySelector('.ag-row .cell-invalid')).toBeNull();
});

it('preserves formatted-number callbacks through AG Grid sorting', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [{ quantity: 4 }, { quantity: 3 }];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { quantity: { type: 'integer' } } },
      },
      data,
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          cells: {
            quantity: {
              format: true,
              toFormatted: (value: number | undefined) => (value === undefined ? '' : `#${value}`),
              fromFormatted: (value: string) => Number(value.replace('#', '')),
            },
          },
          agGridOptions: {
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
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'quantity', sort: 'asc' }] });
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>('.ag-row[row-index="0"] input[type="text"]');
  await vi.waitFor(() => expect(sortedInput()?.value).toBe('#3'));
  const input = sortedInput()!;
  input.focus();
  const beforeInvalid = onchange.mock.calls.length;
  input.value = '#bad';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(input.closest('.ag-row')?.querySelector('.cell-invalid')).not.toBeNull(),
  );
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);
  expect(document.activeElement).toBe(input);
  input.value = '#5';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 4 }, { quantity: 5 }]),
  );
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(1)?.data?.value).toEqual({ quantity: 5 }),
  );
  expect(view.container.querySelector('.ag-row .cell-invalid')).toBeNull();
  expect(document.activeElement).toBe(input);
});
