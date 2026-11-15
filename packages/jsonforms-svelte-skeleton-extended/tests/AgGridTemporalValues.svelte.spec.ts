import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema7 } from '@jsonforms/core';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';

afterEach(cleanup);

it.each([
  {
    format: 'date',
    minimum: '2026-10-01',
    first: '2026-10-15',
    second: '2026-10-14',
    invalid: '2026-09-30',
    valid: '2026-10-16',
    config: { dateFormat: 'YYYY-MM-DD' },
  },
  {
    format: 'date-time',
    minimum: '2026-10-01T00:00:00Z',
    first: '2026-10-15T11:00:00Z',
    second: '2026-10-14T10:00:00Z',
    invalid: '2026-09-30 10:00:00',
    valid: '2026-10-16 10:00:00',
    config: { dateTimeFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
] as const)('edits the original sorted $format row and scopes range feedback', async (scenario) => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const data = [
    { when: scenario.first, name: 'first' },
    { when: scenario.second, name: 'second' },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            when: {
              type: 'string',
              format: scenario.format,
              formatMinimum: scenario.minimum,
            } as JsonSchema7,
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
      config: { restrict: false, mask: false, ...scenario.config },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.applyColumnState({ state: [{ colId: 'when', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data[1]));
  const sortedInput = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="0"] .ag-cell[col-id="when"] input[type="text"]',
    );
  await vi.waitFor(() => expect(sortedInput()?.value).toContain('2026-10-14'));
  const input = sortedInput()!;
  input.focus();
  input.value = scenario.invalid;
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[1].when).toMatch(/^2026-09-30/));
  expect(onchange.mock.lastCall?.[0].data[0]).toEqual(data[0]);
  await vi.waitFor(() =>
    expect(input.closest('.ag-row')?.querySelector('.cell-invalid')).not.toBeNull(),
  );
  expect(view.container.querySelector('.ag-row[row-index="1"] .cell-invalid')).toBeNull();
  expect(document.activeElement).toBe(input);
  expect(data[1].when).toBe(scenario.second);

  input.value = scenario.valid;
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[1].when).toMatch(/^2026-10-16/));
  await vi.waitFor(() =>
    expect((api!.getDisplayedRowAtIndex(1)?.data?.value as { name?: string })?.name).toBe('second'),
  );
  expect(view.container.querySelector('.ag-row .cell-invalid')).toBeNull();
});
