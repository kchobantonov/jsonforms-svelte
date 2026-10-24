import './test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { shadcnRenderers, shadcnCells } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers, shadcnExtendedCells } from '../src/lib';
import { createSpecAgGridExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid';
import { createSpecKitchenSinkExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-kitchen-sink';
import gridMessages from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';
import jobMessages from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-kitchen-sink/translations.json';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
const renderers = [...shadcnExtendedRenderers, ...shadcnRenderers];
const cells = [...shadcnExtendedCells, ...shadcnCells];
it.each(['en', 'bg'] as const)(
  'runs canonical AG Grid pagination and grouped native overrides in %s',
  async (locale) => {
    const example = createSpecAgGridExample(() => locale);
    const apis = new Map<number, GridApi>();
    let gridIndex = 0;
    function capture(value: unknown): void {
      if (!value || typeof value !== 'object') return;
      const node = value as Record<string, unknown>;
      const options = node.options as Record<string, unknown> | undefined;
      if (options?.variant === 'ag-grid') {
        const index = gridIndex++;
        options.agGridOptions = {
          ...(options.agGridOptions as object),
          onGridReady: (event: GridReadyEvent) => {
            apis.set(index, event.api);
          },
        };
      }
      Object.values(node).forEach(capture);
    }
    capture(example.uischema);
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers,
        cells,
      },
    });
    const labels = gridMessages[locale];
    await page
      .getByRole('tab', { name: labels['specAgGrid.ui.elements.1.label'], exact: true })
      .click();
    await vi.waitFor(() => expect(apis.get(0)?.paginationGetPageSize()).toBe(3));
    await page
      .getByRole('tab', { name: labels['specAgGrid.ui.elements.5.label'], exact: true })
      .click();
    await vi.waitFor(() => expect(apis.get(4)?.paginationGetPageSize()).toBe(2));
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll('.ag-header-group-cell-label')).some((node) =>
          node.textContent?.includes(
            labels[
              'specAgGrid.ui.elements.5.elements.1.options.agGridOptions.columnDefs.0.headerName'
            ],
          ),
        ),
      ).toBe(true),
    );
    await page
      .getByRole('tab', { name: labels['specAgGrid.ui.elements.6.label'], exact: true })
      .click();
    await vi.waitFor(() => expect(apis.get(5)?.getGridOption('pagination')).toBe(false));
    expect(apis.get(5)!.getDisplayedRowCount()).toBe(12);
  },
);
it.each(['en', 'bg'] as const)(
  'edits the canonical job application without losing sibling data in %s',
  async (locale) => {
    const example = createSpecKitchenSinkExample(() => locale);
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers,
        cells,
        onchange,
      },
    });
    const name = page.getByRole('textbox', {
      name: jobMessages[locale]['firstName.label'],
      exact: true,
    });
    await name.fill('Updated applicant');
    (name.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        ...(example.data as object),
        firstName: 'Updated applicant',
      }),
    );
  },
);
