import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
afterEach(cleanup);

it('routes native cell edit requests through the form after sorting and ignores readonly edits', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const onCellEditRequest = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'name', editable: true }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
            onCellEditRequest,
          },
        },
      },
      data: [{ name: 'Zoe' }, { name: 'Ada' }],
      onchange,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  expect(api!.getGridOption('readOnlyEdit')).toBe(true);
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
  const originalKey = api!.getDisplayedRowAtIndex(0)!.data!.key;
  api!.getDisplayedRowAtIndex(0)!.setDataValue('name', 'Bea');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Zoe' }, { name: 'Bea' }]),
  );
  expect(onCellEditRequest).toHaveBeenCalledOnce();
  expect(api!.getDisplayedRowAtIndex(0)?.data?.key).toBe(originalKey);

  await view.rerender({ readonly: true });
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual({ name: 'Bea' }),
  );
  api!.getDisplayedRowAtIndex(0)!.setDataValue('name', 'Ignored');
  expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Zoe' }, { name: 'Bea' }]);

  await view.rerender({ readonly: false, data: [{ name: 'Zoe' }, { name: 'Replacement' }] });
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual({ name: 'Replacement' }),
  );
  expect(api!.getDisplayedRowAtIndex(0)?.data?.key).not.toBe(originalKey);
  const staleRequest = onCellEditRequest.mock.calls[0][0];
  const changes = onchange.mock.calls.length;
  api!.getGridOption('onCellEditRequest')?.({ ...staleRequest, newValue: 'Stale' });
  expect(onchange.mock.calls).toHaveLength(changes);
});

it('routes a native edit of a primitive array through the value column', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { type: 'array', items: { type: 'string' } },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'value', editable: true }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      data: ['Zoe', 'Ada'],
      onchange,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  api!.getDisplayedRowAtIndex(1)!.setDataValue('value', 'Bea');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(['Zoe', 'Bea']));
});

it('edits a literal dotted property without creating a nested object', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { 'a.b': { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'a.b', editable: true }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      data: [{ 'a.b': 'old' }],
      onchange,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(1));
  const originalKey = api!.getDisplayedRowAtIndex(0)!.data!.key;
  api!.getDisplayedRowAtIndex(0)!.setDataValue('a.b', 'new');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ 'a.b': 'new' }]));
  expect(api!.getDisplayedRowAtIndex(0)?.data?.key).toBe(originalKey);
});

it('commits an AG Grid text editor override into form data', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'name', editable: true }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      data: [{ name: 'Ada' }],
      onchange,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(1));
  api!.startEditingCell({ rowIndex: 0, colKey: 'name' });
  const editor = view.container.querySelector<HTMLInputElement>('.ag-cell-editor input');
  expect(editor).not.toBeNull();
  editor!.value = 'Bea';
  editor!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  api!.stopEditing();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Bea' }]));
});

it('flushes a sibling cell draft before a native edit and blocks during composition', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'name', editable: true }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => (api = event.api),
          },
        },
      },
      data: [{ name: 'First' }, { name: 'Second' }],
      onchange,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  const input = view.container.querySelector<HTMLInputElement>(
    '.ag-row[row-index="0"] .ag-cell[col-id="name"] input',
  );
  expect(input).not.toBeNull();
  input!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input!.value = 'Draft';
  input!.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  const previous = onchange.mock.calls.length;
  api!.getDisplayedRowAtIndex(1)!.setDataValue('name', 'Edited');
  expect(onchange.mock.calls).toHaveLength(previous);

  input!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  api!.getDisplayedRowAtIndex(1)!.setDataValue('name', 'Edited');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Draft' }, { name: 'Edited' }]),
  );
});
