import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
import { page } from 'vite-plus/test/browser';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it('opens panel details when the row background is clicked and forwards the native row event', async () => {
  const onRowClicked = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, notes: { type: 'string' } },
        },
      },
      data: [
        { name: 'Ada', notes: 'First note' },
        { name: 'Bea', notes: 'Second note' },
      ],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          rowDetail: {
            presentation: 'panel',
            detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
          },
          agGridOptions: { onRowClicked },
        },
      },
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
    },
  });
  await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2));
  view.container.querySelector<HTMLElement>('.ag-row[row-index="1"]')!.click();
  await expect
    .element(page.getByRole('textbox', { name: 'Notes', exact: true }))
    .toHaveValue('Second note');
  expect(onRowClicked).toHaveBeenCalledOnce();
});

it.each(['dialog', 'panel'] as const)(
  'keeps %s row details inspectable but readonly when the array schema is readOnly',
  async (presentation) => {
    await render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          readOnly: true,
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, notes: { type: 'string' } },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            variant: 'ag-grid',
            rowDetail: {
              presentation,
              detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
            },
          },
        },
        data: [{ name: 'Ada', notes: 'Original' }],
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
      },
    });
    await page
      .getByRole('button', {
        name: messages.en['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .click();
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
    await expect.element(notes).toHaveValue('Original');
    expect(
      (notes.element() as HTMLInputElement).disabled ||
        (notes.element() as HTMLInputElement).readOnly,
    ).toBe(true);
  },
);

it.each(['dialog', 'panel'] as const)(
  'keeps %s detail errors on the source row when sorting',
  async (presentation) => {
    let api: GridApi<AgGridWrappedRow> | undefined;
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              notes: { type: 'string', minLength: 8 },
            },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            variant: 'ag-grid',
            columnDefs: [{ field: 'name' }],
            rowDetail: {
              presentation,
              detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
            },
            agGridOptions: {
              onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
                api = event.api;
              },
            },
          },
        },
        data: [
          { name: 'Grace', notes: 'Long enough' },
          { name: 'Ada', notes: 'Short' },
        ],
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
      },
    });
    await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
    api!.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
    await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-row[row-index="0"] [data-row-detail-errors]'),
      ).not.toBeNull(),
    );
    expect(
      view.container.querySelector('.ag-row[row-index="1"] [data-row-detail-errors]'),
    ).toBeNull();

    api!.applyColumnState({ state: [{ colId: 'name', sort: 'desc' }] });
    await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(0));
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-row[row-index="1"] [data-row-detail-errors]'),
      ).not.toBeNull(),
    );
    expect(
      view.container.querySelector('.ag-row[row-index="0"] [data-row-detail-errors]'),
    ).toBeNull();
    const detailButton = view.container.querySelector(
      '.ag-row[row-index="1"] .ag-cell[col-id="$detail"] button',
    );
    expect(detailButton).toBeInstanceOf(HTMLButtonElement);
    (detailButton as HTMLButtonElement).click();
    await page.getByRole('textbox', { name: 'Notes', exact: true }).fill('Long enough now');
    if (presentation === 'dialog')
      await page.getByRole('button', { name: messages.en['composite.apply'], exact: true }).click();
    else
      await page
        .getByRole('button', { name: messages.en['collection.hideDetails'], exact: true })
        .click();
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-row-detail-errors]')).toBeNull(),
    );
  },
);

it.each(['dialog', 'panel'] as const)(
  'edits the original sorted/paged row using %s details',
  async (presentation) => {
    let api: GridApi<AgGridWrappedRow> | undefined;
    const onchange = vi.fn();
    const data = [
      { name: 'Grace', notes: 'Grace note' },
      { name: 'Ada', notes: 'Ada note' },
    ];
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, notes: { type: 'string' } },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            variant: 'ag-grid',
            columnDefs: [{ field: 'name' }],
            pagination: { pageSize: 1, pageSizeOptions: [1, 2] },
            rowDetail: {
              presentation,
              collapsed: true,
              detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
            },
            agGridOptions: {
              onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
                api = event.api;
              },
            },
          },
        },
        data,
        onchange,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
      },
    });
    await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
    expect(api!.getColumn('$detail')?.getColDef()).toMatchObject({
      colId: '$detail',
      pinned: 'right',
      lockPinned: true,
      flex: 0,
    });
    expect(api!.getColumn('$detail')?.getPinned()).toBe('right');
    api!.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
    await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
    await expect.element(page.getByRole('textbox').first()).toHaveValue('Ada');
    const open = () =>
      page
        .getByRole('button', {
          name: messages.en['collection.editRowDetails'].replace('{index}', '2'),
          exact: true,
        })
        .first()
        .click();
    await open();
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
    await expect.element(notes).toHaveValue('Ada note');
    if (presentation === 'dialog') {
      await notes.fill('Discarded');
      await page
        .getByRole('button', { name: messages.en['composite.cancel'], exact: true })
        .click();
      await open();
      await expect.element(notes).toHaveValue('Ada note');
    } else {
      await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
      expect(api!.getSelectedNodes()).toHaveLength(0);
      expect(view.container.querySelector('[data-row-detail-selected="true"]')).not.toBeNull();
    }
    await notes.fill('Edited Ada');
    if (presentation === 'dialog')
      await page.getByRole('button', { name: messages.en['composite.apply'], exact: true }).click();
    else {
      await page
        .getByRole('button', { name: messages.en['collection.hideDetails'], exact: true })
        .click();
      await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
      await page
        .getByRole('button', { name: messages.en['collection.showDetails'], exact: true })
        .click();
      await expect.element(notes).toHaveValue('Edited Ada');
    }
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual([
        { name: 'Grace', notes: 'Grace note' },
        { name: 'Ada', notes: 'Edited Ada' },
      ]),
    );
  },
);

it('keeps a nested ListWithDetail selection and draft through row-detail dialog reorder', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            contacts: {
              type: 'array',
              items: { type: 'object', properties: { company: { type: 'string' } } },
            },
          },
        },
      },
      data: [{ name: 'Ada', contacts: [{ company: 'First' }, { company: 'Second' }] }],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          rowDetail: {
            presentation: 'dialog',
            detail: {
              type: 'ListWithDetail',
              scope: '#/properties/contacts',
              options: {
                showSortButtons: true,
                detail: { type: 'Control', scope: '#/properties/company', label: 'Company' },
              },
            },
          },
        },
      },
      onchange,
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
    },
  });
  await page
    .getByRole('button', {
      name: messages.en['collection.editRowDetails'].replace('{index}', '1'),
      exact: true,
    })
    .click();
  const dialog = page.getByRole('dialog');
  const items = dialog.getByRole('option');
  await vi.waitFor(() =>
    expect(dialog.element().querySelectorAll('[role="option"]')).toHaveLength(2),
  );
  await items.first().click();
  const company = dialog.getByRole('textbox', { name: 'Company', exact: true });
  await expect.element(company).toHaveValue('First');
  const editor = company.element();
  await dialog.getByRole('button', { name: 'Move item down', exact: true }).first().click();
  await expect.element(company).toHaveValue('First');
  expect(company.element()).toBe(editor);
  await company.fill('Edited first');
  expect(company.element()).toBe(editor);
  await dialog.getByRole('button', { name: messages.en['composite.apply'], exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { name: 'Ada', contacts: [{ company: 'Second' }, { company: 'Edited first' }] },
    ]),
  );
});
