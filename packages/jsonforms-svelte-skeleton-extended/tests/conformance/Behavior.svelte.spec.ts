import '../../../jsonforms-svelte-skeleton/tests/test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../../src/lib/ag-grid/types';
import isEqual from 'lodash/isEqual';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import { tick } from 'svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { UISchemaElement } from '@jsonforms/core';
import vectors from '../../../../tests/fixtures/spec-conformance/behavior.json';
import { buttonRendererEntry, durationControlRendererEntry } from '../../src/lib/controls';
import { mountControl, mountForm } from '../testUtils';

afterEach(cleanup);
const vector = (id: string) => {
  const found = vectors.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing canonical behavior vector: ${id}`);
  return found;
};
it('script-default-closed', async () => {
  const { input, expected } = vector('script-default-closed');
  const { view, onchange } = await mountForm({
    schema: {},
    data: {},
    uischema: input.button as UISchemaElement,
    renderers: [buttonRendererEntry],
  });
  await view.rerender({ config: input.config });
  await tick();
  expect(
    view.container.querySelector(`[data-button-diagnostic="${expected.diagnostic}"]`),
  ).toBeTruthy();
  expect(Boolean(view.container.querySelector('button'))).toBe(expected.executed);
  expect(onchange.mock.calls.every(([event]) => JSON.stringify(event.data) === '{}')).toBe(true);
});
it.each(['en', 'bg', 'fr-CA'] as const)('duration-unchanged / %s', async (locale) => {
  const { input, expected } = vector('duration-unchanged');
  const labels: Record<string, string> =
    locale === 'fr-CA'
      ? {
          'duration.open': 'Choisir une durée',
          'duration.weeks': 'Semaines',
          'duration.ok': 'Appliquer',
        }
      : messages[locale];
  const { onchange, view } = await mountControl({
    propertySchema: { type: 'string', format: 'duration' },
    value: input.data,
    renderers: [durationControlRendererEntry],
  });
  await view.rerender({ i18n: { locale, translate: (key, fallback) => labels[key] ?? fallback } });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: labels['duration.open'], exact: true }).click();
  await expect
    .element(page.getByRole('spinbutton', { name: labels['duration.weeks'], exact: true }))
    .toBeVisible();
  await page.getByRole('button', { name: labels['duration.ok'], exact: true }).click();
  await tick();
  expect(onchange.mock.calls.slice(before)).toHaveLength(expected.changes!);
  expect(onchange.mock.lastCall?.[0].data.value).toBe(expected.data);
});

it('port-summary-search', async () => {
  const { input, expected } = vector('port-summary-search');
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const original = JSON.parse(JSON.stringify(input.data));
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: { contact: { type: 'object', properties: { city: { type: 'string' } } } },
            },
          },
        },
      },
      data: { rows: input.data },
      config: { jsonformsExtended: { dynamicValues: { enabled: true } } },
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        options: {
          variant: 'ag-grid',
          columnDefs: [{ field: 'contact', scope: '#/properties/contact' }],
          cells: {
            contact: {
              summary: {
                type: 'Label',
                text: '**{city}**',
                options: {
                  markup: 'markdown',
                  interpolate: true,
                  textParams: { city: '{item.contact.city}' },
                },
              },
            },
          },
          agGridOptions: {
            pagination: false,
            defaultColDef: { filter: 'agTextColumnFilter' },
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
      cells: [...skeletonExtendedCells, ...skeletonCells],
      onchange,
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  await vi.waitFor(() =>
    expect(api!.getCellValue({ rowNode: api!.getDisplayedRowAtIndex(0)!, colKey: 'contact' })).toBe(
      expected.filterTextForFirstRow,
    ),
  );
  api!.setFilterModel({ contact: { filterType: 'text', type: 'contains', filter: 'Boston' } });
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowCount()).toBe(expected.matchingRowIndices!.length),
  );
  expect(
    Array.from(
      { length: api!.getDisplayedRowCount() },
      (_, index) => api!.getDisplayedRowAtIndex(index)?.data?.sourceIndex,
    ),
  ).toEqual(expected.matchingRowIndices);
  expect(
    isEqual(input.data, original) &&
      onchange.mock.calls.every(([event]) => isEqual(event.data.rows, original)),
  ).toBe(expected.dataUnchanged);
});
