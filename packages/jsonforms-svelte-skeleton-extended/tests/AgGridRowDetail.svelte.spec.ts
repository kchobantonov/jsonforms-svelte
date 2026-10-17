import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
import { page } from 'vitest/browser';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['dialog', 'panel'] as const)(
  'edits the original sorted/paged row using %s details',
  async (presentation) => {
    let api: GridApi<AgGridWrappedRow> | undefined;
    const onchange = vi.fn();
    const data = [
      { name: 'Grace', notes: 'Grace note' },
      { name: 'Ada', notes: 'Ada note' },
    ];
    const view = render(JsonForms, {
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
