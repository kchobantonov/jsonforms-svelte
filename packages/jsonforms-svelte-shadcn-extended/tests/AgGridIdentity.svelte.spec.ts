import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent, RowDragEndEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);

it('keeps a row-local server error on its source cell through sorting and filtering', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      data: [{ name: 'Alpha' }, { name: 'Zulu' }],
      additionalErrors: [
        {
          instancePath: '/0/name',
          schemaPath: '#/host',
          keyword: 'host',
          params: {},
          message: 'Server error',
        },
      ],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            defaultColDef: { filter: 'agTextColumnFilter' },
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  const errorKey = api!.getDisplayedRowAtIndex(0)!.data!.key;
  const input = (key: string) =>
    view.container.querySelector<HTMLInputElement>(
      `.ag-row[row-id="${key}"] .ag-cell[col-id="name"] input`,
    );
  await vi.waitFor(() => expect(input(errorKey)?.getAttribute('aria-invalid')).toBe('true'));
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'desc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(1)?.data?.key).toBe(errorKey));
  expect(input(errorKey)?.getAttribute('aria-invalid')).toBe('true');
  api!.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Zulu' } });
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
  await vi.waitFor(() => expect(input(errorKey)).toBeNull());
  api!.setFilterModel(null);
  await vi.waitFor(() => expect(input(errorKey)?.getAttribute('aria-invalid')).toBe('true'));
});

async function setup(locale: 'en' | 'bg' = 'en') {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const changes = vi.fn();
  const data = {
    rows: [
      { name: 'same', notes: 'same' },
      { name: 'same', notes: 'same' },
    ],
    sibling: 'keep',
  };
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, notes: { type: 'string' } },
            },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        label: 'Rows',
        options: {
          variant: 'ag-grid',
          showSortButtons: true,
          confirmation: { delete: 'never' },
          columnDefs: [{ field: 'name' }],
          rowDetail: {
            presentation: 'panel',
            collapsed: true,
            detail: {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/notes', label: 'Notes' }],
            },
          },
          agGridOptions: {
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      data,
      i18n: { locale },
      onchange: changes,
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2), { timeout: 10000 });
  const keys = () =>
    Array.from(
      { length: api!.getDisplayedRowCount() },
      (_, index) => api!.getDisplayedRowAtIndex(index)!.data!.key,
    );
  const original = keys();
  const cell = (key: string) =>
    view.container.querySelector<HTMLInputElement>(
      `.ag-row[row-id="${key}"] .ag-cell[col-id="name"] input`,
    )!;
  await vi.waitFor(() => expect(cell(original[1])).toBeTruthy());
  await page
    .getByRole('button', {
      name: messages[locale]['collection.editRowDetails'].replace('{index}', '2'),
      exact: true,
    })
    .click();
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  await expect.element(notes).toHaveValue('same');
  const detail = notes.element();
  const remove = async (key: string) => {
    api!.deselectAll();
    api!.getRowNode(key)!.setSelected(true);
    const button = page.getByRole('button', {
      name: messages[locale]['array.removeAriaLabel'],
      exact: true,
    });
    await expect.element(button).toBeEnabled();
    (button.element() as HTMLButtonElement).click();
  };
  return { view, api: api!, data, changes, original, keys, cell, notes, detail, remove };
}

it.each(['en', 'bg'] as const)(
  'retains duplicate row cells and selected details through local commands in %s',
  async (locale) => {
    const { api, view, changes, original, keys, cell, notes, detail, remove } = await setup(locale);
    const editor = cell(original[1]);
    const nativeRows = api.getGridOption('rowData');
    await view.rerender({
      additionalErrors: [
        {
          instancePath: '/rows/0/name',
          schemaPath: '',
          keyword: 'server',
          params: {},
          message: 'Server error',
        },
      ],
    });
    expect(api.getGridOption('rowData')).toBe(nativeRows);
    await notes.fill('Edited detail');
    (notes.element() as HTMLElement).blur();
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data.rows[1].notes).toBe('Edited detail'),
    );
    expect(keys()).toEqual(original);
    expect(cell(original[1])).toBe(editor);
    const add = page.getByRole('button', {
      name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', 'Rows'),
      exact: true,
    });
    await add.click();
    await vi.waitFor(() => expect(api.getDisplayedRowCount()).toBe(3));
    expect(keys().slice(0, 2)).toEqual(original);
    editor.value = 'Selected row';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    editor.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data.rows[1].name).toBe('Selected row'),
    );
    api.getGridOption('onRowDragEnd')!({
      api,
      node: api.getRowNode(original[1])!,
      overNode: api.getRowNode(original[0])!,
    } as RowDragEndEvent<AgGridWrappedRow>);
    await vi.waitFor(() => expect(keys().slice(0, 2)).toEqual([original[1], original[0]]));
    expect(notes.element()).toBe(detail);
    expect(cell(original[1])).toBe(editor);
    await expect.element(notes).toHaveValue('Edited detail');
    expect(cell(original[1]).value).toBe('Selected row');
    editor.value = 'Moved row';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    editor.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data.rows[0].name).toBe('Moved row'));
    expect(changes.mock.lastCall?.[0].data.rows[1].name).toBe('same');
    await remove(original[0]);
    await vi.waitFor(() => expect(api.getDisplayedRowCount()).toBe(2));
    expect(notes.element()).toBe(detail);
    expect(cell(original[1])).toBe(editor);
    await remove(original[1]);
    await vi.waitFor(() => expect(detail.isConnected).toBe(false));
    expect(view.container.querySelector('[data-row-detail-content] input')).toBeNull();
    expect(changes.mock.lastCall?.[0].data).toEqual({ rows: [{}], sibling: 'keep' });
  },
);

it.each(['reference', 'replacement'])(
  'reconciles external %s without transferring selected detail ownership',
  async (operation) => {
    const { view, original, keys, notes, detail, data } = await setup();
    if (operation === 'reference') {
      await view.rerender({ data: { rows: [data.rows[1], data.rows[0]], sibling: 'external' } });
      await vi.waitFor(() => expect(keys()).toEqual([original[1], original[0]]));
      expect(notes.element()).toBe(detail);
    } else {
      await view.rerender({
        data: {
          rows: [
            { name: 'same', notes: 'same' },
            { name: 'same', notes: 'same' },
          ],
          sibling: 'external',
        },
      });
      await vi.waitFor(() => expect(keys().some((key) => original.includes(key))).toBe(false));
      expect(detail.isConnected).toBe(false);
      await view.rerender({ data });
      expect(view.container.querySelector('[data-row-detail-content] input')).toBeNull();
    }
  },
);
