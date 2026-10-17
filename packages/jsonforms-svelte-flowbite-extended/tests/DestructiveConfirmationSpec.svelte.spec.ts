import '../../jsonforms-svelte-flowbite/tests/test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers, flowbiteExtendedCells } from '../src/lib';
import { createSpecDestructiveConfirmationExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation';
import translations from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'confirms a sorted grid selection as one batch in %s',
  async (locale) => {
    const example = createSpecDestructiveConfirmationExample(() => locale);
    let api: GridApi<AgGridWrappedRow> | undefined;
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        onchange,
        renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
        cells: [...flowbiteExtendedCells, ...flowbiteCells],
        uischema: {
          type: 'Control',
          scope: '#/properties/charges',
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
    await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(3));
    api!.applyColumnState({ state: [{ colId: 'amount', sort: 'asc' }] });
    api!.getDisplayedRowAtIndex(0)!.setSelected(true);
    api!.getDisplayedRowAtIndex(1)!.setSelected(true);
    const remove = page
      .elementLocator(view.container.querySelector('.jsonforms-ag-grid__toolbar')!)
      .getByRole('button')
      .first();
    await expect.element(remove).toBeEnabled();
    await remove.click();
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await expect.element(dialog).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await vi.waitFor(() => expect(dialog.query()).toBeNull());
    expect(api!.getSelectedNodes()).toHaveLength(2);
    await remove.click();
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    const expected = structuredClone(example.data) as { charges: unknown[] };
    expected.charges = [expected.charges[0]];
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
    expect(api!.getSelectedNodes()).toHaveLength(0);
  },
);
