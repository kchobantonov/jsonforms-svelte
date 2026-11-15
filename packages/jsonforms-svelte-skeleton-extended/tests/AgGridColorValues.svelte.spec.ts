import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it('keeps invalid color text local and edits the correct source row after sorting', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [
    { color: '#bbbbbb', name: 'first' },
    { color: '#aaaaaa', name: 'second' },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            color: { type: 'string', format: 'color' },
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
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'color', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>('.ag-row[row-index="0"] input[type="text"]');
  await vi.waitFor(() => expect(sortedInput()?.value).toBe('#aaaaaa'));
  const input = sortedInput()!;
  input.focus();
  const beforeInvalid = onchange.mock.calls.length;
  input.value = 'rgb(';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
  expect(input.value).toBe('rgb(');
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);
  expect(document.activeElement).toBe(input);
  expect(view.container.querySelector('.ag-row[row-index="1"] [aria-invalid="true"]')).toBeNull();
  input.value = '#ffffff';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { color: '#bbbbbb', name: 'first' },
      { color: '#ffffff', name: 'second' },
    ]),
  );
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(1)?.data?.value).toEqual({
      color: '#ffffff',
      name: 'second',
    }),
  );
  expect(view.container.querySelector('.ag-row [aria-invalid="true"]')).toBeNull();
  expect(data[1].color).toBe('#aaaaaa');
});
