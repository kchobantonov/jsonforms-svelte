import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';

afterEach(cleanup);
it('filters and sorts resolved Label text while retaining source identity and enforcing live access policy', async () => {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onGridReady = (event: GridReadyEvent<AgGridWrappedRow>) => {
    api = event.api;
  };
  const config = (enabled: boolean) => ({ jsonformsExtended: { dynamicValues: { enabled } } });
  const data = {
    heading: 'Applicants',
    rows: [
      { name: 'Beta', contact: { city: 'Austin' } },
      { name: 'Alpha', contact: { city: 'Boston' } },
    ],
  };
  const summary = {
    type: 'Label',
    i18n: 'preview',
    text: '{name} / {city} / {heading}',
    options: {
      interpolate: true,
      textParams: { name: '{item.name}', city: '{item.contact.city}', heading: '{data.heading}' },
    },
  };
  const control = (native: Record<string, unknown> = {}) => ({
    type: 'Control',
    scope: '#/properties/rows',
    options: {
      variant: 'ag-grid',
      columnDefs: [{ field: 'summary', scope: '#' }],
      cells: { summary: { summary } },
      agGridOptions: {
        onGridReady,
        pagination: false,
        defaultColDef: { filter: 'agTextColumnFilter', sortable: true },
        ...native,
      },
    },
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                contact: { type: 'object', properties: { city: { type: 'string' } } },
              },
            },
          },
        },
      },
      data,
      config: config(true),
      uischema: control(),
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
    },
  });
  const firstText = () =>
    api &&
    !api.isDestroyed() &&
    api.getDisplayedRowAtIndex(0) &&
    api.getCellValue({ rowNode: api.getDisplayedRowAtIndex(0)!, colKey: 'summary' });
  await vi.waitFor(() => expect(firstText()).toBe('Beta / Austin / Applicants'));
  api!.applyColumnState({ state: [{ colId: 'summary', sort: 'asc' }] });
  await vi.waitFor(() => expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1));
  api!.setFilterModel({ summary: { filterType: 'text', type: 'contains', filter: 'Austin' } });
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
  expect(api!.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(0);
  expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual(data.rows[0]);
  await view.rerender({ config: config(false) });
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(0));
  await view.rerender({
    config: config(true),
    i18n: {
      locale: 'bg',
      translate: (key, fallback) =>
        key === 'preview.text' ? '{heading}: {city} ({name})' : (fallback ?? key),
    },
  });
  await vi.waitFor(() => expect(firstText()).toBe('Applicants: Austin (Beta)'));
  await view.rerender({ data: { ...data, heading: 'Updated' } });
  await vi.waitFor(() => expect(firstText()).toBe('Updated: Austin (Beta)'));
  api!.setFilterModel(null);
  await view.rerender({
    uischema: control({ columnDefs: [{ field: 'summary', valueGetter: () => 'Native override' }] }),
  });
  await vi.waitFor(() => expect(firstText()).toBe('Native override'));
});
