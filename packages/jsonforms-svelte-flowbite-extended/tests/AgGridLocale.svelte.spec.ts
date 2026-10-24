import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
import '../../jsonforms-svelte-flowbite/tests/test.css';

afterEach(cleanup);
const schema = {
  type: 'array',
  items: { type: 'object', properties: { name: { type: 'string' }, notes: { type: 'string' } } },
};
const registries = {
  renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
  cells: [...flowbiteExtendedCells, ...flowbiteCells],
};
it('refreshes native grid messages without losing sorting, filtering, paging, widths or selection', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const control = (native: Record<string, unknown> = {}) => ({
    type: 'Control',
    scope: '#',
    options: {
      variant: 'ag-grid',
      pagination: { pageSize: 2, pageSizeOptions: [2, 4] },
      agGridOptions: { onGridReady, defaultColDef: { filter: 'agTextColumnFilter' }, ...native },
    },
  });
  const data = Array.from({ length: 12 }, (_, index) => ({
    name: `Name ${String(index).padStart(2, '0')}`,
    notes: 'Preserved',
  }));
  const view = await render(JsonForms, {
    props: {
      schema,
      data,
      uischema: control(),
      ...registries,
      i18n: { locale: 'en' },
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(12));
  api!.applyColumnState({ state: [{ colId: 'name', sort: 'desc', width: 260 }] });
  api!.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Name' } });
  api!.getDisplayedRowAtIndex(0)!.setSelected(true);
  api!.paginationGoToPage(2);
  const originalApi = api!;
  const selectedKey = api!.getSelectedNodes()[0].data!.key;
  await view.rerender({ i18n: { locale: 'bg' } });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[aria-label="Следваща страница"]')).not.toBeNull(),
  );
  await vi.waitFor(() => expect(api !== originalApi && !api?.isDestroyed()).toBe(true));
  expect(originalApi.isDestroyed()).toBe(true);
  expect(api!.paginationGetCurrentPage()).toBe(2);
  expect(api!.getColumn('name')!.getActualWidth()).toBe(260);
  expect(api!.getColumn('name')!.getSort()).toBe('desc');
  expect(api!.getFilterModel()).toEqual({
    name: { filterType: 'text', type: 'contains', filter: 'Name' },
  });
  expect(api!.getSelectedNodes().map((node) => node.data!.key)).toEqual([selectedKey]);
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual(data[11]);
  await view.rerender({
    i18n: {
      locale: 'fr',
      translate: (key, fallback) => (key === 'agGrid.nextPage' ? 'Suivant' : (fallback ?? key)),
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[aria-label="Suivant"]')).not.toBeNull(),
  );
  await view.rerender({
    uischema: control({ localeText: { nextPage: 'Native next', pageSizeSelectorLabel: '' } }),
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[aria-label="Native next"]')).not.toBeNull(),
  );
  expect(view.container.querySelector('.ag-paging-page-size .ag-label')?.textContent).toBe('');
});

it('keeps an isolated row draft open during a language change and refreshes after Apply', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ name: 'Ada', notes: 'Original' }],
      ...registries,
      onchange,
      i18n: { locale: 'en' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          columnDefs: [{ field: 'name' }],
          rowDetail: {
            presentation: 'dialog',
            detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
          },
          agGridOptions: {
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(1));
  const originalApi = api!;
  await page
    .getByRole('button', {
      name: messages.en['collection.editRowDetails'].replace('{index}', '1'),
      exact: true,
    })
    .click();
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  await notes.fill('Kept draft');
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect
    .element(page.getByRole('button', { name: messages.bg['composite.apply'], exact: true }))
    .toBeVisible();
  await expect.element(notes).toHaveValue('Kept draft');
  expect(originalApi.isDestroyed()).toBe(false);
  await page.getByRole('button', { name: messages.bg['composite.apply'], exact: true }).click();
  await vi.waitFor(() => expect(api !== originalApi && !api?.isDestroyed()).toBe(true));
  expect(originalApi.isDestroyed()).toBe(true);
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual({
      name: 'Ada',
      notes: 'Kept draft',
    }),
  );
  expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Ada', notes: 'Kept draft' }]);
});

it('defers native grid localization until an invalid numeric cell draft is corrected', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { amount: { type: 'integer' } } },
      },
      data: [{ amount: 2 }],
      ...registries,
      i18n: { locale: 'en' },
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
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(1));
  const originalApi = api!;
  const input = view.container.querySelector<HTMLInputElement>('.ag-cell[col-id="amount"] input')!;
  await page.elementLocator(input).fill('2.5');
  await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
  await view.rerender({ i18n: { locale: 'bg' } });
  expect(originalApi.isDestroyed()).toBe(false);
  expect(input.isConnected).toBe(true);
  expect(input.value).toBe('2.5');
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual({ amount: 2 });
  await page.elementLocator(input).fill('3');
  await vi.waitFor(() => expect(api !== originalApi && !api?.isDestroyed()).toBe(true));
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual({ amount: 3 });
  expect(view.container.querySelector('[aria-label="Следваща страница"]')).not.toBeNull();
});
