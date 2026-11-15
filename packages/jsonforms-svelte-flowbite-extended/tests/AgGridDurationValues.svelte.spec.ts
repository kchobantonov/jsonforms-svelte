import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it('keeps invalid duration text local and edits the correct source row after sorting', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [
    { duration: 'P3D', name: 'first' },
    { duration: 'P2D', name: 'second' },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            duration: { type: 'string', format: 'duration' },
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
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'duration', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="0"] .ag-cell[col-id="duration"] input[type="text"]',
    );
  await vi.waitFor(() => expect(sortedInput()?.value).toBe('P2D'));
  const input = sortedInput()!;
  input.focus();
  const beforeInvalid = onchange.mock.calls.length;
  input.value = 'P1DT';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
  expect(input.value).toBe('P1DT');
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);
  expect(document.activeElement).toBe(input);
  expect(view.container.querySelector('.ag-row[row-index="1"] [aria-invalid="true"]')).toBeNull();
  input.value = 'P5D';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { duration: 'P3D', name: 'first' },
      { duration: 'P5D', name: 'second' },
    ]),
  );
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(1)?.data?.value).toEqual({
      duration: 'P5D',
      name: 'second',
    }),
  );
  expect(view.container.querySelector('.ag-row [aria-invalid="true"]')).toBeNull();
  expect(data[1].duration).toBe('P2D');
});
